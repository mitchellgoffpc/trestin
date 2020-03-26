import _ from 'lodash'
import * as Three from 'three'
import { Dirt, Grass } from 'blocks'
import Directions from 'util/directions'


// Constants

const elementOffsets = { x: 0, y: 1, z: 2 }


// Helper functions

const nextPowerOf2 = x => {
    let power = 1
    while (power < x) {
        power <<= 1 }
    return power }

const getAdjacentPositions = (x, y, z) =>
    ({ [`${x + 1},${y},${z}`]: Directions.WEST,
       [`${x - 1},${y},${z}`]: Directions.EAST,
       [`${x},${y + 1},${z}`]: Directions.UP,
       [`${x},${y - 1},${z}`]: Directions.DOWN,
       [`${x},${y},${z + 1}`]: Directions.NORTH,
       [`${x},${y},${z - 1}`]: Directions.SOUTH })

const getVerticesForSide = (x, y, z, direction) => do {
    if (direction === Directions.UP)
        [x, y + 1, z,  x + 1, y + 1, z + 1,  x + 1, y + 1, z,
         x, y + 1, z,  x, y + 1, z + 1,      x + 1, y + 1, z + 1]
    else if (direction === Directions.DOWN)
        [x, y, z,      x + 1, y, z,          x + 1, y, z + 1,
         x, y, z,      x + 1, y, z + 1,      x, y, z + 1]
    else if (direction === Directions.NORTH)
        [x, y, z + 1,  x + 1, y, z + 1,      x + 1, y + 1, z + 1,
         x, y, z + 1,  x + 1, y + 1, z + 1,  x, y + 1, z + 1]
    else if (direction === Directions.SOUTH)
        [x, y, z,      x + 1, y + 1, z,      x + 1, y, z,
         x, y, z,      x, y + 1, z,          x + 1, y + 1, z]
    else if (direction === Directions.WEST)
        [x + 1, y, z,  x + 1, y + 1, z + 1,  x + 1, y, z + 1,
         x + 1, y, z,  x + 1, y + 1, z,      x + 1, y + 1, z + 1]
    else if (direction === Directions.EAST)
        [x, y, z,      x, y, z + 1,          x, y + 1, z + 1,
         x, y, z,      x, y + 1, z + 1,      x, y + 1, z] }


// Chunk class

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
                const elevation = Math.floor ((noise.noise2D ((x * 16 + i) / 32, (z * 16 + j) / 32) / 2 + .5) * 4)
                for (let dy = 0; dy <= elevation; dy++) {
                    this.blocks[`${i},${dy},${j}`] = dy >= elevation - 1 ? Grass : Dirt }}}

        // Create geometry and physics body
        this.createBufferGeometry ()
        this.createPhysicsBody () }


    // Methods for creating and destroying objects

    placeBlock = (x, y, z, block) => {
        const { color, position }  = this.mesh.geometry.attributes
        const bufferCapacity = position.array.length
        const blockPosition = `${x},${y},${z}`

        let bufferSize = this.mesh.geometry.drawRange.count * 3
        let blockFaceIndices = []

        // TODO: Resize the buffers if necessary

        _.forEach (getAdjacentPositions (x, y, z), (direction, adjacentPosition) => {

            // If there's already a block on this side, we'll remove any of that block's vertices that are facing us
            if (this.blocks[adjacentPosition]) {
                const offset = elementOffsets[direction.axis]
                const facePositionOnAxis = { x, y, z }[direction.axis] + (direction.vector[direction.axis] + 1) / 2

                for (let faceIndex of this.blockFaceIndices[adjacentPosition]) {
                    if (position.array[(faceIndex * 3) * 3 + offset] === facePositionOnAxis &&
                        position.array[(faceIndex * 3 + 1) * 3 + offset] === facePositionOnAxis &&
                        position.array[(faceIndex * 3 + 2) * 3 + offset] === facePositionOnAxis) {

                        position.array.set (position.array.slice (bufferSize - 9, bufferSize), faceIndex * 9)
                        color.array.set (color.array.slice (bufferSize - 9, bufferSize), faceIndex * 9)
                        bufferSize -= 9 }}}

            // If there isn't a block, we'll create some new faces on this side instead
            else {
                this.faceIndexPositions[bufferSize / 9] = blockPosition
                this.faceIndexPositions[bufferSize / 9 + 1] = blockPosition
                blockFaceIndices.push (bufferSize / 9, bufferSize / 9 + 1)

                position.array.set (getVerticesForSide (x, y, z, direction), bufferSize)
                color.array.set (block.colorData, bufferSize)
                color.array.set (block.colorData, bufferSize + 9)
                bufferSize += 18 }})

        // Once the vertex buffer has been updated, we refresh the postiion attribute
        this.blocks[blockPosition] = block
        this.blockFaceIndices[blockPosition] = blockFaceIndices

        this.mesh.geometry.setDrawRange (0, bufferSize / 3)
        this.mesh.geometry.computeBoundingSphere ()
        this.mesh.geometry.computeVertexNormals ()

        position.needsUpdate = true
        color.needsUpdate = true }

    placeBlockOnFace = (faceIndex, block) => {
        const [x, y, z] = this.getBlockForFaceIndex (faceIndex)
        this.placeBlock (x, y + 1, z, block) }

    placeLight = (x, y, z, intensity = 1.0) => {
        const [wx, wy, wz] = this.getWorldPosFromChunkPos(x, y, z)
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (wx, wy, wz)
        this.lights[light.uuid] = light
        this.scene.add (light)
        return light }

    destroyBlock = (x, y, z) => {
        delete this.blocks[`${x},${y},${z}`] }


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

        this.mesh.geometry.attributes.color.needsUpdate = true
        for (let faceIndex of faceIndices) {
            this.mesh.geometry.attributes.color.array.set (colorData, faceIndex * 9) }}


    // Create the vertex and color buffers for this chunk

    createBufferGeometry = () => {
        const [cx, cy, cz] = this.position
        const vertexBuffer = new Float32Array (_.size (this.blocks) * 108)
        const colorBuffer  = new Float32Array (_.size (this.blocks) * 108)
        let vertexIndex = 0

        _.forEach (this.blocks, (block, position) => {
            const [x, y, z] = this.getCoordinatesFromString (position)
            const faceIndices = []

            _.forEach (getAdjacentPositions (x, y, z), (direction, adjacentPosition) => {
                if (!this.blocks[adjacentPosition]) {
                    this.faceIndexPositions[vertexIndex / 9] = position
                    this.faceIndexPositions[vertexIndex / 9 + 1] = position
                    faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)
                    vertexBuffer.set (getVerticesForSide (x, y, z, direction), vertexIndex)
                    colorBuffer.set  (block.colorData, vertexIndex)
                    colorBuffer.set  (block.colorData, vertexIndex + 9)
                    vertexIndex += 18 }})

            this.blockFaceIndices[position] = faceIndices })

        const geometry = new Three.BufferGeometry ()
        const material = new Three.MeshLambertMaterial ({ vertexColors: Three.VertexColors })
        const bufferSize = nextPowerOf2 (vertexIndex / 3) * 3
        geometry.addAttribute ('position', new Three.BufferAttribute (vertexBuffer.slice (0, bufferSize), 3))
        geometry.addAttribute ('color',    new Three.BufferAttribute (colorBuffer.slice  (0, bufferSize), 3))
        geometry.setDrawRange (0, vertexIndex / 3)
        geometry.computeVertexNormals ()

        this.mesh = new Three.Mesh (geometry, material)
        this.mesh.position.set (cx * 16, cy * 16, cz * 16)
        this.scene.add (this.mesh) }


    // Create the Cannon physics body for this chunk

    createPhysicsBody = () => {}
}
