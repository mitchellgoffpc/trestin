import * as Three from 'three'
import uuid from 'uuid/v4'

import Blocks from 'blocks'
import Directions from 'util/directions'
import { getVerticesForSide } from 'util/geometry'
import { getBlockIndex,
         getBlockIndexForPosition,
         getPositionForBlockIndex,
         positionIsWithinChunk } from 'util/coordinates'


// Chunk class

// To optimize space, `Chunk` maintains five arrays that track the relationships
// between blocks and their faces:
//
//  -- blockIndicesForFaces maps each faceIndex to a block position.
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
//
//  -- blockIndicesForBFBOffsets maps each offset in blockFaceBuffer to a block index.
//     This is useful anytime we have to deallocate the space in the BFB for a block
//     that isn't visible anymore.

export default class Chunk {
    neighbors = new Array (Directions.All.length)
    loadedNeighbors = 0
    lights = {}

    constructor (world, position, blocks, sides, sidesAreSolid) {
        this.world = world
        this.position = position
        this.blocks = blocks
        this.sides = sides
        this.sidesAreSolid = sidesAreSolid }


    // Methods for creating objects

    placeBlock (position, block) {
        this.blocks[getBlockIndexForPosition (position)] = block.ID

        Directions.getAdjacentPositions (position) .forEach (({ direction, adjacentPosition }) => {
            if (positionIsWithinChunk (adjacentPosition)) {
                if (this.blocks[getBlockIndexForPosition (adjacentPosition)])
                     this.removeBlockFace (adjacentPosition, direction.opposite)
                else this.createBlockFace (position, direction, block, true) }

            else { // If the neighboring block is in a different chunk, we need to ask `this.world` to deal with it for us
                const adjacentWorldPos = this.getWorldPosFromChunkPos (adjacentPosition)
                if (this.world.getBlockAtPosition (adjacentWorldPos))
                     this.world.removeBlockFace (adjacentWorldPos, direction.opposite)
                else this.createBlockFace (position, direction, block, true) }})

        this.refreshGeometry () }

    placeBlockOnFace (faceIndex, block) {
        const vertexBuffer = this.mesh.geometry.attributes.position.array
        const position = getPositionForBlockIndex (this.blockIndicesForFaces[faceIndex])
        const faceDirection = Directions.All.find (direction => direction.index === Math.floor (this.BFBIndicesForFaces[faceIndex] / 2))
        this.placeBlock (faceDirection.getAdjacentPosition (position), block) }

    placeLight (position, intensity = 1.0) {
        const { x: wx, y: wy, z: wz } = this.getWorldPosFromChunkPos (position)
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (wx, wy, wz)
        this.lights[light.uuid] = light
        this.world.scene.add (light)
        return light }


    // Methods for destroying objects

    destroyBlock (position) {
        Directions.getAdjacentPositions (position) .forEach (({ direction, adjacentPosition }) => {
            if (positionIsWithinChunk (adjacentPosition)) {
                const adjacentBlockID = this.blocks[getBlockIndexForPosition (adjacentPosition)]
                if (adjacentBlockID)
                     this.createBlockFace (adjacentPosition, direction.opposite, Blocks.fromBlockID (adjacentBlockID))
                else this.removeBlockFace (position, direction) }

            else { // If the neighboring block is in a different chunk, we need to ask `this.world` to deal with it for us
                const adjacentWorldPos = this.getWorldPosFromChunkPos (adjacentPosition)
                const adjacentBlockID = this.world.getBlockAtPosition (adjacentWorldPos)
                if (adjacentBlockID)
                     this.world.createBlockFace (adjacentWorldPos, direction.opposite, Blocks.fromBlockID (adjacentBlockID))
                else this.removeBlockFace (position, direction) }})

        this.blocks[getBlockIndexForPosition (position)] = 0
        this.refreshGeometry () }

    destroyBlockWithFace (faceIndex) {
        this.destroyBlock (getPositionForBlockIndex (this.blockIndicesForFaces[faceIndex])) }


    // Methods for adding and removing block faces

    createBlockFace (position, direction, block, highlight = false) {
        const blockIndex = getBlockIndexForPosition (position)
        const vertices = this.mesh.geometry.drawRange.count
        const colorData = highlight ? block.highlightColorData : block.colorData

        // If this block doesn't have any visible faces, allocate some new space in the BFB
        if (this.BFBOffsetsForBlocks[blockIndex] === -1) {
            this.BFBOffsetsForBlocks[blockIndex] = this.blockFaceBufferSize
            // this.blockIndicesForBFBOffsets[this.blockFaceBufferSize / 12] = blockIndex
            this.blockFaceBufferSize += 12 }

        const blockBFBOffset = this.BFBOffsetsForBlocks[blockIndex]
        for (let i = 0; i < 2; i++) { // Loop twice because we need two faces per side
            const faceIndex = vertices / 3 + i
            const faceBFBIndex = direction.index * 2 + i

            this.blockFaceBuffer[blockBFBOffset + faceBFBIndex] = faceIndex
            this.BFBIndicesForFaces[faceIndex] = faceBFBIndex
            this.blockIndicesForFaces[faceIndex] = blockIndex
            this.mesh.geometry.attributes.color.array.set (colorData[faceBFBIndex], faceIndex * 9) }

        this.mesh.geometry.attributes.position.array.set (getVerticesForSide (position, direction), vertices * 3)
        this.mesh.geometry.setDrawRange (0, vertices + 6) }


    removeBlockFace (position, direction) {
        const blockIndex = getBlockIndexForPosition (position)
        const blockBFBOffset = this.BFBOffsetsForBlocks[blockIndex]

        if (blockBFBOffset !== -1) { // In other words, if this block has any visible faces...
            for (let i = 0; i < 2; i++) { // Loop over the faces pointing in this direction
                const vertices = this.mesh.geometry.drawRange.count
                const vertexBuffer = this.mesh.geometry.attributes.position.array
                const colorBuffer = this.mesh.geometry.attributes.color.array

                const faceIndex = this.blockFaceBuffer[blockBFBOffset + direction.index * 2 + i]
                const faceIndexToMove = vertices / 3 - 1

                // Move the data from the end of the vertex and color buffers into the empty space
                if (faceIndex !== faceIndexToMove) {
                    vertexBuffer.set (vertexBuffer.slice (faceIndexToMove * 9, faceIndexToMove * 9 + 9), faceIndex * 9)
                    colorBuffer.set  (colorBuffer.slice  (faceIndexToMove * 9, faceIndexToMove * 9 + 9), faceIndex * 9)

                    const faceBFBOffset =  blockBFBOffset + this.BFBIndicesForFaces[faceIndex]
                    const blockIndexOfFaceToMove = this.blockIndicesForFaces[faceIndexToMove]
                    const BFBIndexOfFaceToMove = this.BFBIndicesForFaces[faceIndexToMove]
                    const BFBOffsetOfFaceToMove = this.BFBOffsetsForBlocks[blockIndexOfFaceToMove] + BFBIndexOfFaceToMove

                    this.blockFaceBuffer[BFBOffsetOfFaceToMove] = faceIndex
                    this.BFBIndicesForFaces[faceIndex] = BFBIndexOfFaceToMove
                    this.blockIndicesForFaces[faceIndex] = blockIndexOfFaceToMove }

                this.blockFaceBuffer[blockBFBOffset + direction.index * 2 + i] = -1
                this.BFBIndicesForFaces[faceIndexToMove] = -1
                this.blockIndicesForFaces[faceIndexToMove] = -1

                this.mesh.geometry.setDrawRange (0, vertices - 3) }

            // Remove the blockFaceBuffer data if this block doesn't have any faces left
            // if (this.blockFaceBuffer.slice (blockBFBOffset, blockBFBOffset + 12) .every (x => x === -1)) {
            //     if (blockBFBOffset !== this.blockFaceBufferSize - 12) {
            //         const BFBDataToMove = this.blockFaceBuffer.slice (this.blockFaceBufferSize - 12, this.blockFaceBufferSize)
            //         const blockIndexOfBFBDataToMove = this.blockIndicesForBFBOffsets[this.blockFaceBufferSize / 12 - 1]
            //
            //         this.blockIndicesForBFBOffsets[blockBFBOffset / 12] = blockIndexOfBFBDataToMove
            //         this.BFBOffsetForBlocks[blockIndexOfBFBDataToMove] = blockBFBOffset
            //         this.blockFaceBuffer.set (BFBData, blockBFBOffset) }
            //
            //     this.blockIndicesForBFBOffsets[this.blockFaceBufferSize / 12 - 1] = 0
            //     this.BFBOffsetsForBlocks[blockIndex] = -1
            //     this.blockFaceBufferSize -= 12 }
        }}


    // Helper method for refreshing the geometry

    refreshGeometry () {
        this.mesh.geometry.attributes.position.needsUpdate = true
        this.mesh.geometry.attributes.color.needsUpdate = true

        this.mesh.geometry.computeBoundingSphere ()
        this.mesh.geometry.computeVertexNormals () }


    // Helper method for updating block highlights

    setBlockHighlight (position, highlight) {
        const blockIndex = getBlockIndexForPosition (position)

        if (this.blocks[blockIndex]) {
            const block = Blocks.fromBlockID (this.blocks[blockIndex])
            const blockBFBOffset = this.BFBOffsetsForBlocks[blockIndex]
            const colorData = highlight ? block.highlightColorData : block.colorData
            const colorAttribute = this.mesh.geometry.attributes.color

            for (let i = 0; i < 12; i++) {
                if (this.blockFaceBuffer[blockBFBOffset + i] !== -1) {
                    colorAttribute.array.set (colorData[i], this.blockFaceBuffer[blockBFBOffset + i] * 9) }}

            colorAttribute.needsUpdate = true }}


    // Helper methods for doing coordinate transforms/lookups

    getBlockAtPosition (position) {
        return this.blocks ? this.blocks[getBlockIndexForPosition (position)] : 0 }

    getBlockPositionForFaceIndex (faceIndex) {
        return getPositionForBlockIndex (this.blockIndicesForFaces[faceIndex]) }

    getChunkPosFromWorldPos ({ x, y, z }) {
        return { x: x - this.position.x * 16, y: y - this.position.y * 16, z: z - this.position.z * 16 }}

    getWorldPosFromChunkPos ({ x, y, z }) {
        return { x: x + this.position.x * 16, y: y + this.position.y * 16, z: z + this.position.z * 16 }}


    // Create the vertex and color buffers for this chunk

    createBufferGeometry (buffers, vertexBufferSize, blockFaceBufferSize) {
        this.blockFaceBuffer = buffers.blockFaceBuffer
        this.BFBIndicesForFaces = buffers.BFBIndicesForFaces
        this.BFBOffsetsForBlocks = buffers.BFBOffsetsForBlocks
        this.blockIndicesForFaces = buffers.blockIndicesForFaces
        this.blockIndicesForBFBOffsets = buffers.blockIndicesForBFBOffsets

        const geometry = new Three.BufferGeometry ()
        const material = new Three.MeshLambertMaterial ({ vertexColors: Three.VertexColors })

        geometry.setAttribute ('position', new Three.BufferAttribute (buffers.vertexBuffer, 3))
        geometry.setAttribute ('color',    new Three.BufferAttribute (buffers.colorBuffer, 3))
        geometry.setDrawRange (0, vertexBufferSize / 3)
        geometry.computeVertexNormals ()

        this.mesh = new Three.Mesh (geometry, material)
        this.mesh.name = "CHUNK"
        this.mesh.position.set (this.position.x * 16, this.position.y * 16, this.position.z * 16)
        this.world.scene.add (this.mesh) }


    // Create the Cannon physics body for this chunk

    createPhysicsBody () {
        let boxes = []
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                boxes.push ({ x, z, minY: 0, maxY: x + z }) }}

        this.world.physics.addChunk (uuid (), this.position, boxes) }
}
