import * as Three from 'three'

import Block from 'blocks'
import PhysicsChunk from 'physics'

// Helper method
const replicate = data => _.flatten(_.times(3, () => data))

const Dirt = {
    colorData: replicate([.9, .525, .325]),
    highlightColorData: replicate([.95, .625, .4]) }
const Grass = {
    colorData: replicate([.215, .6, .25]),
    highlightColorData: replicate([.265, .7, .325]) }


export default class Chunk {
    blocks = {}
    lights = {}
    blockFaceIndices = {}
    faceIndexPositions = {}

    constructor (x, y, z, noise, scene, physics) {
        this.position = [x, y, z]
        this.scene = scene
        this.physics = physics

        // Spawn all of the blocks in this chunk
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                const elevation = Math.floor((noise.noise2D((x * 16 + i) / 32, (z * 16 + j) / 32) / 2 + .5) * 4)
                for (let dy = 0; dy <= elevation; dy++) {
                    this.blocks[`${i},${dy},${j}`] = dy >= elevation - 1 ? Grass : Dirt }}}

        // Create geometry and physics body
        this.createBufferGeometry ()
        this.createPhysicsBody () }


    // Methods for creating and destroying objects

    placeBlock = (x, y, z, { block, color } = {}) => {
        const [wx, wy, wz] = this.getWorldPosFromChunkPos(x, y, z)
        block = block || new Block (color)
        block.mesh.position.set (wx, wy, wz)
        this.blocks[block.uuid] = block
        return block }

    placeLight = (x, y, z, intensity = 1.0) => {
        const [wx, wy, wz] = this.getWorldPosFromChunkPos(x, y, z)
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (wx, wy, wz)
        this.lights[light.uuid] = light
        this.scene.add (light)
        return light }

    destroyBlock = uuid => {
        const block = this.blocks[uuid]
        delete this.blocks[uuid]
        return block }


    // Helper methods for doing coordinate transforms/lookups & updating block highlights

    getCoordinatesFromString = position =>
        position.split(',').map(x => parseInt (x))

    getBlockForFaceIndex = faceIndex =>
        this.getCoordinatesFromString (this.faceIndexPositions[faceIndex])

    getChunkPosFromWorldPos = (x, y, z) => {
        const [cx, cy, cz] = this.position
        return [x - cx * 16, y - cy * 16, z - cz * 16] }

    getWorldPosFromChunkPos = (x, y, z) => {
        const [cx, cy, cz] = this.position
        return [cx * 16 + x, cy * 16 + y, cz * 16 + z] }

    setBlockHighlight = (x, y, z, highlight) => {
        const position = `${x},${y},${z}`
        const block = this.blocks[position]
        const faceIndices = this.blockFaceIndices[position]
        const colorData = highlight ? block.highlightColorData : block.colorData

        this.colorAttribute.needsUpdate = true
        for (let faceIndex of faceIndices) {
            this.colorAttribute.array.set (colorData, faceIndex * 9) }}


    // Create the vertex and color buffers for this chunk

    createBufferGeometry = () => {
        const [cx, cy, cz] = this.position
        const vertexBuffer = new Float32Array (_.size (this.blocks) * 108)
        const colorBuffer  = new Float32Array (_.size (this.blocks) * 108)
        let vertexIndex = 0

        for (let position in this.blocks) {
            const [x, y, z] = this.getCoordinatesFromString (position)
            const block = this.blocks[position]
            const faceIndices = []

            // bottom & top
            if (y === 0 || !this.blocks[`${x},${y - 1},${z}`]) {
                this.faceIndexPositions[vertexIndex / 9] = position
                this.faceIndexPositions[vertexIndex / 9 + 1] = position
                faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                vertexBuffer.set ([x, y, z,      x + 1, y, z,          x + 1, y, z + 1],     vertexIndex)
                vertexBuffer.set ([x, y, z,      x + 1, y, z + 1,      x, y, z + 1],         vertexIndex + 9)
                colorBuffer.set  (block.colorData, vertexIndex)
                colorBuffer.set  (block.colorData, vertexIndex + 9)
                vertexIndex += 18 }
            if (y === 15 || !this.blocks[`${x},${y + 1},${z}`]) {
                this.faceIndexPositions[vertexIndex / 9] = position
                this.faceIndexPositions[vertexIndex / 9 + 1] = position
                faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                vertexBuffer.set ([x, y + 1, z,  x + 1, y + 1, z + 1,  x + 1, y + 1, z],     vertexIndex)
                vertexBuffer.set ([x, y + 1, z,  x, y + 1, z + 1,      x + 1, y + 1, z + 1], vertexIndex + 9)
                colorBuffer.set  (block.colorData, vertexIndex)
                colorBuffer.set  (block.colorData, vertexIndex + 9)
                vertexIndex += 18 }

            // south & north
            if (z === 0 || !this.blocks[`${x},${y},${z - 1}`]) {
                this.faceIndexPositions[vertexIndex / 9] = position
                this.faceIndexPositions[vertexIndex / 9 + 1] = position
                faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                vertexBuffer.set ([x, y, z,      x + 1, y + 1, z,      x + 1, y, z],         vertexIndex)
                vertexBuffer.set ([x, y, z,      x, y + 1, z,          x + 1, y + 1, z],     vertexIndex + 9)
                colorBuffer.set  (block.colorData, vertexIndex)
                colorBuffer.set  (block.colorData, vertexIndex + 9)
                vertexIndex += 18 }
            if (z === 15 || !this.blocks[`${x},${y},${z + 1}`]) {
                this.faceIndexPositions[vertexIndex / 9] = position
                this.faceIndexPositions[vertexIndex / 9 + 1] = position
                faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                vertexBuffer.set ([x, y, z + 1,  x + 1, y, z + 1,      x + 1, y + 1, z + 1], vertexIndex)
                vertexBuffer.set ([x, y, z + 1,  x + 1, y + 1, z + 1,  x, y + 1, z + 1],     vertexIndex + 9)
                colorBuffer.set  (block.colorData, vertexIndex)
                colorBuffer.set  (block.colorData, vertexIndex + 9)
                vertexIndex += 18 }

            // west & east
            if (x === 0 || !this.blocks[`${x - 1},${y},${z}`]) {
                this.faceIndexPositions[vertexIndex / 9] = position
                this.faceIndexPositions[vertexIndex / 9 + 1] = position
                faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                vertexBuffer.set ([x, y, z,      x, y, z + 1,          x, y + 1, z + 1],     vertexIndex)
                vertexBuffer.set ([x, y, z,      x, y + 1, z + 1,      x, y + 1, z],         vertexIndex + 9)
                colorBuffer.set  (block.colorData, vertexIndex)
                colorBuffer.set  (block.colorData, vertexIndex + 9)
                vertexIndex += 18 }
            if (x === 15 || !this.blocks[`${x + 1},${y},${z}`]) {
                this.faceIndexPositions[vertexIndex / 9] = position
                this.faceIndexPositions[vertexIndex / 9 + 1] = position
                faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                vertexBuffer.set ([x + 1, y, z,  x + 1, y + 1, z + 1,  x + 1, y, z + 1],     vertexIndex)
                vertexBuffer.set ([x + 1, y, z,  x + 1, y + 1, z,      x + 1, y + 1, z + 1], vertexIndex + 9)
                colorBuffer.set  (block.colorData, vertexIndex)
                colorBuffer.set  (block.colorData, vertexIndex + 9)
                vertexIndex += 18 }

            this.blockFaceIndices[position] = faceIndices }

        let geometry = new Three.BufferGeometry ()
        let material = new Three.MeshLambertMaterial ({ vertexColors: Three.VertexColors })
        geometry.addAttribute ('position', new Three.BufferAttribute (vertexBuffer.slice (0, vertexIndex), 3))
        geometry.addAttribute ('color',    new Three.BufferAttribute (colorBuffer.slice  (0, vertexIndex), 3))
        geometry.computeVertexNormals ()

        this.vertexAttribute = geometry.attributes.position
        this.colorAttribute = geometry.attributes.color

        this.mesh = new Three.Mesh (geometry, material)
        this.mesh.position.set (cx * 16, cy * 16, cz * 16)
        this.scene.add (this.mesh) }


    // Create the Cannon physics body for this chunk

    createPhysicsBody = () => {

    }
}
