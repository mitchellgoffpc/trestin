import * as Three from 'three'
import Blocks from 'blocks'
import Directions from 'util/directions'
import { coords, getCoordsForPosition, getPositionForCoords } from 'util/coordinates'


// Constants

const CHUNK_VOLUME = 16 * 16 * 16


// Helper functions

const highestToLowest = (a, b) => b - a

const nextPowerOf2 = x => {
    let power = 1
    while (power < x) {
        power <<= 1 }
    return power }

const getFaceDirection = (position, vertices) =>
    Directions.All.find (direction => facePointsInDirection (position, direction, vertices))

const facePointsInDirection = (position, direction, vertices) => {
    const elementOffset = { x: 0, y: 1, z: 2 }[direction.axis]
    const facePositionOnAxis = position[direction.axis] + (direction.vector[direction.axis] + 1) / 2
    return vertices[0 * 3 + elementOffset] === facePositionOnAxis &&
           vertices[1 * 3 + elementOffset] === facePositionOnAxis &&
           vertices[2 * 3 + elementOffset] === facePositionOnAxis }

const getAdjacentPosition = ({ x, y, z }, direction) =>
    ({ x: x + direction.vector.x, y: y + direction.vector.y, z: z + direction.vector.z })

const getAdjacentCoordinates = ({ x, y, z }) =>
    [{ direction: Directions.WEST,  adjacentCoordinates: coords (x + 1, y, z), adjacentPosition: { x: x + 1, y, z }},
     { direction: Directions.EAST,  adjacentCoordinates: coords (x - 1, y, z), adjacentPosition: { x: x - 1, y, z }},
     { direction: Directions.UP,    adjacentCoordinates: coords (x, y + 1, z), adjacentPosition: { x, y: y + 1, z }},
     { direction: Directions.DOWN,  adjacentCoordinates: coords (x, y - 1, z), adjacentPosition: { x, y: y - 1, z }},
     { direction: Directions.NORTH, adjacentCoordinates: coords (x, y, z + 1), adjacentPosition: { x, y, z: z + 1 }},
     { direction: Directions.SOUTH, adjacentCoordinates: coords (x, y, z - 1), adjacentPosition: { x, y, z: z - 1 }}]

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

// To optimize space, `Chunk` maintains four arrays that track the relationships
// between blocks and their faces:
//
//  -- blockIndicesForFaces maps each faceIndex to a block position
//
//  -- blockFaceBuffer is a memory heap that contains the face indices of every
//     visible block in this chunk. Since most blocks will be completely obscured
//     by their neighbors, this saves memory by letting us allocate space only for
//     blocks that have at least once visible face.
//
//  -- BFBOffsetsForBlocks maps each block position to a position in
//     blockFaceBuffer that contains all the face indices for that block,
//     or -1 if the block has no visible faces.
//
//  -- BFBIndicesForFaces maps each faceIndex to an index in that face's block data
//     in `blockFaceBuffer`. This is convenient for tracking which direction the face
//     is pointing, and for quickly updating the buffer data when we need to rearrange
//     the vertex buffer.

export default class Chunk {
    blocks = new Int32Array (CHUNK_VOLUME)
    lights = {}

    constructor (x, y, z, world) {
        this.position = { x, y, z }
        this.world = world

        // Spawn all of the blocks in this chunk
        let chunkContainsBlocks = false
        for (let bx = 0; bx < 16; bx++) {
            for (let bz = 0; bz < 16; bz++) {
                const elevation =
                    Math.floor ((world.noise.noise2D ((x * 16 + bx) / 64,  (z * 16 + bz) / 64) / 2 + .5) * 8) +
                    Math.floor ((world.noise.noise2D ((x * 16 + bx) / 256, (z * 16 + bz) / 256) / 2 + .5) * 64) -
                    y * 16

                for (let by = 0; by <= elevation && by < 16; by++) {
                    this.blocks[coords (bx, by, bz)] = by >= elevation - 1 ? Blocks.Grass.ID : Blocks.Dirt.ID
                    chunkContainsBlocks = true }}}

        if (!chunkContainsBlocks) { this.blocks = null }}


    // Methods for creating objects

    placeBlock (position, block) {
        this.blocks[getCoordsForPosition (position)] = block.ID

        for (let { adjacentCoordinates, adjacentPosition, direction } of getAdjacentCoordinates (position)) {
            const adjacentWorldPos = this.getWorldPosFromChunkPos (adjacentPosition)

            // If the neighboring block is in a different chunk, we need to ask `this.world` to deal with it for us
            if (adjacentCoordinates === null && this.world.getBlockAtPosition (adjacentWorldPos))
                 this.world.removeBlockFace (adjacentWorldPos, direction.opposite)
            else if (adjacentCoordinates !== null && this.blocks[adjacentCoordinates])
                 this.removeBlockFace (adjacentPosition, direction.opposite)
            else this.createBlockFace (position, direction, block, true) }

        this.refreshGeometry () }

    placeBlockOnFace (faceIndex, block) {
        const vertexBuffer = this.mesh.geometry.attributes.position.array
        const position = getPositionForCoords (this.blockIndicesForFaces[faceIndex])
        const faceDirection = getFaceDirection (position, vertexBuffer.slice (faceIndex * 9, faceIndex * 9 + 9))
        this.placeBlock (getAdjacentPosition (position, faceDirection), block) }

    placeLight (position, intensity = 1.0) {
        const { x: wx, y: wy, z: wz } = this.getWorldPosFromChunkPos (position)
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (wx, wy, wz)
        this.lights[light.uuid] = light
        this.world.scene.add (light)
        return light }


    // Methods for destroying objects

    destroyBlock (position) {
        for (let { adjacentCoordinates, adjacentPosition, direction } of getAdjacentCoordinates (position)) {
            if (adjacentCoordinates !== null) {
                const adjacentBlockID = this.blocks[adjacentCoordinates]
                if (adjacentBlockID)
                     this.createBlockFace (adjacentPosition, direction.opposite, Blocks.fromBlockID (adjacentBlockID))
                else this.removeBlockFace (position, direction) }

            else { // If the neighboring block is in a different chunk, we need to ask `this.world` to deal with it for us
                const adjacentWorldPos = this.getWorldPosFromChunkPos (adjacentPosition)
                const adjacentBlockID = this.world.getBlockAtPosition (adjacentWorldPos)
                if (adjacentBlockID)
                     this.world.createBlockFace (adjacentWorldPos, direction.opposite, Blocks.fromBlockID (adjacentBlockID))
                else this.removeBlockFace (position, direction) }}

        this.blocks[getCoordsForPosition (position)] = 0
        this.refreshGeometry () }

    destroyBlockWithFace (faceIndex) {
        this.destroyBlock (getPositionForCoords (this.blockIndicesForFaces[faceIndex])) }


    // Methods for adding and removing block faces

    createBlockFace (position, direction, block, highlight = false) {
        const blockIndex = getCoordsForPosition (position)
        const vertices = this.mesh.geometry.drawRange.count
        const colorData = highlight ? block.highlightColorData : block.colorData

        // If this block doesn't have any visible faces, allocate some new space in the BFB
        if (this.BFBOffsetsForBlocks[blockIndex] === -1) {
            this.BFBOffsetsForBlocks[blockIndex] = this.blockFaceBufferSize
            this.blockFaceBufferSize += 12 }

        const blockBFBOffset = this.BFBOffsetsForBlocks[blockIndex]
        for (let i = 0; i < 2; i++) { // Loop twice because we need two faces per side
            this.blockFaceBuffer[blockBFBOffset + direction.index * 2 + i] = vertices / 3 + i
            this.BFBIndicesForFaces[vertices / 3 + i] = direction.index * 2 + i
            this.blockIndicesForFaces[vertices / 3 + i] = blockIndex }

        this.mesh.geometry.attributes.position.array.set (getVerticesForSide (position, direction), vertices * 3)
        this.mesh.geometry.attributes.color.array.set (colorData, vertices * 3)
        this.mesh.geometry.attributes.color.array.set (colorData, vertices * 3 + 9)

        this.mesh.geometry.setDrawRange (0, vertices + 6) }


    removeBlockFace (position, direction) {
        const blockIndex = getCoordsForPosition (position)
        const blockBFBOffset = this.BFBOffsetsForBlocks[blockIndex]

        if (blockBFBOffset !== -1) { // In other words, if this block has any visible faces...
            for (let i = 0; i < 2; i++) { // Loop over the faces pointing in this direction
                const vertices = this.mesh.geometry.drawRange.count
                const faceIndex = this.blockFaceBuffer[blockBFBOffset + direction.index * 2 + i]
                const faceIndexToMove = vertices / 3 - 1

                // Move the data from the end of the vertex and color buffers into the empty space
                if (faceIndex !== faceIndexToMove) {
                    const vertexBuffer = this.mesh.geometry.attributes.position.array
                    const colorBuffer = this.mesh.geometry.attributes.color.array

                    vertexBuffer.set (vertexBuffer.slice (faceIndexToMove * 9, faceIndexToMove * 9 + 9), faceIndex * 9)
                    colorBuffer.set  (colorBuffer.slice  (faceIndexToMove * 9, faceIndexToMove * 9 + 9), faceIndex * 9)

                    const faceBFBOffset =  blockBFBOffset + this.BFBIndicesForFaces[faceIndex]
                    const blockIndexOfFaceToMove = this.blockIndicesForFaces[faceIndexToMove]
                    const BFBOffsetOfFaceToMove = this.BFBOffsetsForBlocks[blockIndexOfFaceToMove] +
                                                  this.BFBIndicesForFaces[faceIndexToMove]

                    this.blockIndicesForFaces[faceIndex] = blockIndexOfFaceToMove
                    this.blockFaceBuffer[BFBOffsetOfFaceToMove] = faceIndex }

                this.blockIndicesForFaces[faceIndexToMove] = -1
                this.blockFaceBuffer[blockBFBOffset + direction.index * 2 + i] = -1

                this.mesh.geometry.setDrawRange (0, vertices - 3) }

            // Remove the blockFaceBuffer data if this block doesn't have any faces left
            // if (faceIndices.every (x => x === -1)) {
            //     this.BFBOffsetsForBlocks[coordinates] = null
            //
            //     // Move the data from the end of blockFaceBuffer into the empty space
            //     if (faceIndex !== vertices / 3 - 1) {
            //
            //     }
            //
            //     this.blockFaceBufferSize -= 12
            // }}}
        }}


    // Helper method for refreshing the geometry

    refreshGeometry () {
        this.mesh.geometry.attributes.position.needsUpdate = true
        this.mesh.geometry.attributes.color.needsUpdate = true

        this.mesh.geometry.computeBoundingSphere ()
        this.mesh.geometry.computeVertexNormals () }


    // Helper method for updating block highlights

    setBlockHighlight (position, highlight) {
        const blockIndex = getCoordsForPosition (position)

        if (this.blocks[blockIndex]) {
            const block = Blocks.fromBlockID (this.blocks[blockIndex])
            const blockBFBOffset = this.BFBOffsetsForBlocks[blockIndex]
            const colorData = highlight ? block.highlightColorData : block.colorData

            for (let i = blockBFBOffset; i < blockBFBOffset + 12; i++) {
                if (this.blockFaceBuffer[i] !== -1) {
                    this.mesh.geometry.attributes.color.array.set (colorData, this.blockFaceBuffer[i] * 9) }}

            this.mesh.geometry.attributes.color.needsUpdate = true }}


    // Helper methods for doing coordinate transforms/lookups

    getChunkPosFromWorldPos = ({ x, y, z }) =>
        ({ x: x - this.position.x * 16, y: y - this.position.y * 16, z: z - this.position.z * 16 })

    getWorldPosFromChunkPos = ({ x, y, z }) =>
        ({ x: x + this.position.x * 16, y: y + this.position.y * 16, z: z + this.position.z * 16 })


    // Create the vertex and color buffers for this chunk

    createBufferGeometry () {
        const geometry = new Three.BufferGeometry ()
        const material = new Three.MeshLambertMaterial ({ vertexColors: Three.VertexColors })

        if (this.blocks) {
            const vertexBuffer = new Float32Array (CHUNK_VOLUME * 108)
            const colorBuffer  = new Float32Array (CHUNK_VOLUME * 108)

            const blockIndicesForFaces = new Int32Array (CHUNK_VOLUME * 12)
            const blockFaceBuffer      = new Int32Array (CHUNK_VOLUME * 12)
            const BFBIndicesForFaces   = new Int8Array  (CHUNK_VOLUME * 12)
            const BFBOffsetsForBlocks  = new Int32Array (CHUNK_VOLUME)
            BFBOffsetsForBlocks.fill (-1)

            let vertexIndex = 0
            let BFBIndex = 0

            for (let blockIndex = 0; blockIndex < CHUNK_VOLUME; blockIndex++) {
                if (this.blocks[blockIndex]) {
                    const block = Blocks.fromBlockID (this.blocks[blockIndex])
                    const position = getPositionForCoords (blockIndex)
                    const faceIndices = new Int32Array (12)
                    faceIndices.fill (-1)

                    for (let { adjacentCoordinates, adjacentPosition, direction } of getAdjacentCoordinates (position)) {
                        // If the neighboring block is in a different chunk, we need to ask `this.world` to get the block for us
                        const adjacentBlock =
                            adjacentCoordinates === null
                                ? this.world.getBlockAtPosition (this.getWorldPosFromChunkPos (adjacentPosition))
                                : this.blocks[adjacentCoordinates]

                        if (!adjacentBlock) {
                            for (let i = 0; i < 2; i++) { // Loop twice because we need two faces per side
                                faceIndices[direction.index * 2 + i] = vertexIndex / 9 + i
                                BFBIndicesForFaces[vertexIndex / 9 + i] = direction.index * 2 + i
                                blockIndicesForFaces[vertexIndex / 9 + i] = blockIndex }

                            vertexBuffer.set (getVerticesForSide (position, direction), vertexIndex)
                            colorBuffer.set  (block.colorData, vertexIndex)
                            colorBuffer.set  (block.colorData, vertexIndex + 9)
                            vertexIndex += 18 }}

                    if (faceIndices.some (x => x !== -1)) {
                        blockFaceBuffer.set (faceIndices, BFBIndex)
                        BFBOffsetsForBlocks[blockIndex] = BFBIndex
                        BFBIndex += 12 }}}

            const bufferSize = nextPowerOf2 (vertexIndex / 3) * 3
            const blockFaceBufferSize = nextPowerOf2 (BFBIndex / 3) * 3

            this.blockFaceBuffer      = blockFaceBuffer.slice (0, blockFaceBufferSize)
            this.blockIndicesForFaces = blockIndicesForFaces.slice (0, bufferSize)
            this.BFBIndicesForFaces   = BFBIndicesForFaces.slice (0, bufferSize)
            this.BFBOffsetsForBlocks  = BFBOffsetsForBlocks
            this.blockFaceBufferSize  = BFBIndex

            geometry.addAttribute ('position', new Three.BufferAttribute (vertexBuffer.slice (0, bufferSize), 3))
            geometry.addAttribute ('color',    new Three.BufferAttribute (colorBuffer.slice  (0, bufferSize), 3))
            geometry.setDrawRange (0, vertexIndex / 3)
            geometry.computeVertexNormals () }

        this.mesh = new Three.Mesh (geometry, material)
        this.mesh.position.set (this.position.x * 16, this.position.y * 16, this.position.z * 16)
        this.world.scene.add (this.mesh) }


    // Create the Cannon physics body for this chunk

    createPhysicsBody () {}
}
