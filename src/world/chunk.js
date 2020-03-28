import _ from 'lodash'
import * as Three from 'three'
import { Dirt, Grass } from 'blocks'
import Directions from 'util/directions'
import { coords, getCoordsForPosition, getPositionForCoords } from 'util/coordinates'


// Helper functions

const highestToLowest = (a, b) => b - a

const nextPowerOf2 = x => {
    let power = 1
    while (power < x) {
        power <<= 1 }
    return power }

const getFaceDirection = (position, vertices) =>
    _.find (Directions.All, direction => facePointsInDirection (position, direction, vertices))

const facePointsInDirection = (position, direction, vertices) => {
    const elementOffset = { x: 0, y: 1, z: 2 }[direction.axis]
    const facePositionOnAxis = position[direction.axis] + (direction.vector[direction.axis] + 1) / 2
    return vertices[0 * 3 + elementOffset] === facePositionOnAxis &&
           vertices[1 * 3 + elementOffset] === facePositionOnAxis &&
           vertices[2 * 3 + elementOffset] === facePositionOnAxis }

const getAdjacentPosition = ({ x, y, z }, direction) =>
    ({ x: x + direction.vector.x, y: y + direction.vector.y, z: z + direction.vector.z })

const getAdjacentCoordinates = ({ x, y, z }) =>
    [{ direction: Directions.WEST,  adjacentCoordinates: `${x + 1},${y},${z}`, adjacentPosition: { x: x + 1, y, z }},
     { direction: Directions.EAST,  adjacentCoordinates: `${x - 1},${y},${z}`, adjacentPosition: { x: x - 1, y, z }},
     { direction: Directions.UP,    adjacentCoordinates: `${x},${y + 1},${z}`, adjacentPosition: { x, y: y + 1, z }},
     { direction: Directions.DOWN,  adjacentCoordinates: `${x},${y - 1},${z}`, adjacentPosition: { x, y: y - 1, z }},
     { direction: Directions.NORTH, adjacentCoordinates: `${x},${y},${z + 1}`, adjacentPosition: { x, y, z: z + 1 }},
     { direction: Directions.SOUTH, adjacentCoordinates: `${x},${y},${z - 1}`, adjacentPosition: { x, y, z: z - 1 }}]

const getVerticesForSide = ({ x, y, z }, direction) => do {
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
        this.position = { x, y, z }
        this.scene = scene
        this.physics = physics

        // Spawn all of the blocks in this chunk
        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                const elevation = Math.floor ((noise.noise2D ((x * 16 + i) / 32, (z * 16 + j) / 32) / 2 + .5) * 4)
                for (let dy = 0; dy <= elevation; dy++) {
                    this.blocks[coords (i, dy, j)] = dy >= elevation - 1 ? Grass : Dirt }}}

        // Create geometry and physics body
        this.createBufferGeometry ()
        this.createPhysicsBody () }


    // Methods for creating objects

    placeBlock (position, block) {
        const blockCoordinates = getCoordsForPosition (position)
        const { color: colorAttribute, position: positionAttribute }  = this.mesh.geometry.attributes
        let bufferSize = this.mesh.geometry.drawRange.count * 3

        this.blocks[blockCoordinates] = block
        this.blockFaceIndices[blockCoordinates] = []

        // TODO: Resize the buffers if necessary

        // We'll need to add new faces for every side of the block that will be visible, but we
        // also want to delete any faces on blocks directly adjacent to us that would be obscured
        // by the newly-placed block, filling in those vertices with the data from the end of the
        // buffer so we don't get fragmenting.

        for (let { adjacentCoordinates, adjacentPosition, direction } of getAdjacentCoordinates (position)) {
            if (this.blocks[adjacentCoordinates]) {
                _.forEach (this.blockFaceIndices[adjacentCoordinates].sort (highestToLowest), (faceIndex, i) => {
                    if (facePointsInDirection (adjacentPosition, direction.opposite, positionAttribute.array.slice (faceIndex * 9, faceIndex * 9 + 9))) {
                        const lastFaceIndex = bufferSize / 9 - 1
                        const coordsOfBlockToMove = this.faceIndexPositions[lastFaceIndex]
                        delete this.faceIndexPositions[lastFaceIndex]
                        this.blockFaceIndices[adjacentCoordinates][i] = null

                        if (faceIndex !== lastFaceIndex) {
                            this.faceIndexPositions[faceIndex] = coordsOfBlockToMove
                            this.blockFaceIndices[coordsOfBlockToMove] =
                                this.blockFaceIndices[coordsOfBlockToMove].map (i => i === lastFaceIndex ? faceIndex : i)

                            positionAttribute.array.set (positionAttribute.array.slice (bufferSize - 9, bufferSize), faceIndex * 9)
                            colorAttribute.array.set (colorAttribute.array.slice (bufferSize - 9, bufferSize), faceIndex * 9) }

                        bufferSize -= 9 }})

                this.blockFaceIndices[adjacentCoordinates] = this.blockFaceIndices[adjacentCoordinates].filter (x => x !== null) }

            else {
                this.faceIndexPositions[bufferSize / 9] = blockCoordinates
                this.faceIndexPositions[bufferSize / 9 + 1] = blockCoordinates
                this.blockFaceIndices[blockCoordinates].push (bufferSize / 9, bufferSize / 9 + 1)

                positionAttribute.array.set (getVerticesForSide (position, direction), bufferSize)
                colorAttribute.array.set (block.highlightColorData, bufferSize)
                colorAttribute.array.set (block.highlightColorData, bufferSize + 9)
                bufferSize += 18 }}

        // Once the vertex buffer has been updated, we refresh the geometry
        this.mesh.geometry.setDrawRange (0, bufferSize / 3)
        this.mesh.geometry.computeBoundingSphere ()
        this.mesh.geometry.computeVertexNormals ()

        positionAttribute.needsUpdate = true
        colorAttribute.needsUpdate = true }


    placeBlockOnFace (faceIndex, block) {
        const vertexBuffer = this.mesh.geometry.attributes.position.array
        const position = getPositionForCoords (this.faceIndexPositions[faceIndex])
        const faceDirection = getFaceDirection (position, vertexBuffer.slice (faceIndex * 9, faceIndex * 9 + 9))
        this.placeBlock (getAdjacentPosition (position, faceDirection), block) }

    placeLight (position, intensity = 1.0) {
        const { x: wx, y: wy, z: wz } = this.getWorldPosFromChunkPos (position)
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (wx, wy, wz)
        this.lights[light.uuid] = light
        this.scene.add (light)
        return light }


    // Methods for destroying objects

    destroyBlock (position) {
        const blockCoordinates = getCoordsForPosition (position)
        const { color: colorAttribute, position: positionAttribute }  = this.mesh.geometry.attributes
        let bufferSize = this.mesh.geometry.drawRange.count * 3

        // First, we'll need to delete all of this block's faces, filling in those vertices with the data
        // from the end of the buffer just like in `placeBlock`
        for (let faceIndex of this.blockFaceIndices[blockCoordinates].sort (highestToLowest)) {
            const lastFaceIndex = bufferSize / 9 - 1
            const coordsOfBlockToMove = this.faceIndexPositions[lastFaceIndex]
            delete this.faceIndexPositions[lastFaceIndex]

            if (faceIndex !== lastFaceIndex) {
                this.faceIndexPositions[faceIndex] = coordsOfBlockToMove
                this.blockFaceIndices[coordsOfBlockToMove] =
                    this.blockFaceIndices[coordsOfBlockToMove].map (i => i === lastFaceIndex ? faceIndex : i)

                positionAttribute.array.set (positionAttribute.array.slice (bufferSize - 9, bufferSize), faceIndex * 9)
                colorAttribute.array.set (colorAttribute.array.slice (bufferSize - 9, bufferSize), faceIndex * 9) }

            bufferSize -= 9 }

        // We'll also need to add some faces to the blocks directly adjacent to us since we culled out
        // those faces when this block was placed
        for (let { adjacentCoordinates, adjacentPosition, direction } of getAdjacentCoordinates (position)) {
            if (this.blocks[adjacentCoordinates]) {
                this.faceIndexPositions[bufferSize / 9] = adjacentCoordinates
                this.faceIndexPositions[bufferSize / 9 + 1] = adjacentCoordinates
                this.blockFaceIndices[adjacentCoordinates].push (bufferSize / 9, bufferSize / 9 + 1)

                const { colorData } = this.blocks[adjacentCoordinates]
                positionAttribute.array.set (getVerticesForSide (adjacentPosition, direction.opposite), bufferSize)
                colorAttribute.array.set (colorData, bufferSize)
                colorAttribute.array.set (colorData, bufferSize + 9)
                bufferSize += 18 }}

        // Once the vertex buffer has been updated, we remove the block and refresh the geometry
        delete this.blocks[blockCoordinates]
        delete this.blockFaceIndices[blockCoordinates]

        this.mesh.geometry.setDrawRange (0, bufferSize / 3)
        this.mesh.geometry.computeBoundingSphere ()
        this.mesh.geometry.computeVertexNormals ()

        positionAttribute.needsUpdate = true
        colorAttribute.needsUpdate = true }


    destroyBlockWithFace (faceIndex) {
        this.destroyBlock (getPositionForCoords (this.faceIndexPositions[faceIndex])) }


    // Helper methods for doing coordinate transforms/lookups

    getChunkPosFromWorldPos = ({ x, y, z }) =>
        ({ x: x - this.position.x * 16, y: y - this.position.y * 16, z: z - this.position.z * 16 })

    getWorldPosFromChunkPos = ({ x, y, z }) =>
        ({ x: x + this.position.x * 16, y: y + this.position.y * 16, z: z + this.position.z * 16 })


     // Helper method for updating block highlights

    setBlockHighlight (position, highlight) {
        const coordinates = getCoordsForPosition (position)
        const block = this.blocks[coordinates]

        if (block) {
            const colorData = highlight ? block.highlightColorData : block.colorData
            for (let faceIndex of this.blockFaceIndices[coordinates]) {
                this.mesh.geometry.attributes.color.array.set (colorData, faceIndex * 9) }
            this.mesh.geometry.attributes.color.needsUpdate = true }}


    // Create the vertex and color buffers for this chunk

    createBufferGeometry () {
        const vertexBuffer = new Float32Array (_.size (this.blocks) * 108)
        const colorBuffer  = new Float32Array (_.size (this.blocks) * 108)
        let vertexIndex = 0

        _.forEach (this.blocks, (block, coordinates) => {
            const position = getPositionForCoords (coordinates)
            const faceIndices = []

            for (let { adjacentCoordinates, direction } of getAdjacentCoordinates (position)) {
                if (!this.blocks[adjacentCoordinates]) {
                    this.faceIndexPositions[vertexIndex / 9] = coordinates
                    this.faceIndexPositions[vertexIndex / 9 + 1] = coordinates
                    faceIndices.push (vertexIndex / 9, vertexIndex / 9 + 1)

                    vertexBuffer.set (getVerticesForSide (position, direction), vertexIndex)
                    colorBuffer.set  (block.colorData, vertexIndex)
                    colorBuffer.set  (block.colorData, vertexIndex + 9)
                    vertexIndex += 18 }}

            this.blockFaceIndices[coordinates] = faceIndices })

        const geometry = new Three.BufferGeometry ()
        const material = new Three.MeshLambertMaterial ({ vertexColors: Three.VertexColors })
        const bufferSize = nextPowerOf2 (vertexIndex / 3) * 3

        geometry.addAttribute ('position', new Three.BufferAttribute (vertexBuffer.slice (0, bufferSize), 3))
        geometry.addAttribute ('color',    new Three.BufferAttribute (colorBuffer.slice  (0, bufferSize), 3))
        geometry.setDrawRange (0, vertexIndex / 3)
        geometry.computeVertexNormals ()

        this.mesh = new Three.Mesh (geometry, material)
        this.mesh.position.set (this.position.x * 16, this.position.y * 16, this.position.z * 16)
        this.scene.add (this.mesh) }


    // Create the Cannon physics body for this chunk

    createPhysicsBody () {}
}
