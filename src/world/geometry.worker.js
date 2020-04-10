import map from 'lodash-es/map'
import flatMap from 'lodash-es/flatMap'
import forEach from 'lodash-es/forEach'

import Blocks from 'blocks'
import Directions from 'util/directions'
import { getVerticesForSide } from 'util/geometry'
import { getBlockIndexForPosition,
         getPositionForBlockIndex,
         positionIsWithinChunk } from 'util/coordinates'


// Constants

const CHUNK_VOLUME = 16 * 16 * 16

const vertexBuffer = new Float32Array (CHUNK_VOLUME * 108)
const colorBuffer  = new Float32Array (CHUNK_VOLUME * 108)

const blockIndicesForFaces      = new Int32Array (CHUNK_VOLUME * 12)
const blockFaceBuffer           = new Int32Array (CHUNK_VOLUME * 12)
const BFBIndicesForFaces        = new Int32Array (CHUNK_VOLUME * 12)
const BFBOffsetsForBlocks       = new Int32Array (CHUNK_VOLUME)
const blockIndicesForBFBOffsets = new Int32Array (CHUNK_VOLUME)

const faceIndices = new Int32Array (12)


// Helper functions

const nextPowerOf2 = x => {
    let power = 1
    while (power < x) {
        power <<= 1 }
    return power }

const getNeighborIndexForPosition = position => do {
    if (position.x < 0 || position.x > 0xF)
         position.y * 16 + position.z
    else if (position.y < 0 || position.y > 0xF)
         position.x * 16 + position.z
    else position.x * 16 + position.y }


// Attach the message listener

self.addEventListener ("message", ({ data }) => {
    if (data.message === "createChunkGeometry") { createChunkGeometryForBatch (data) }})


// API functions

function createChunkGeometryForBatch ({ chunks }) {
    let results = new Array (chunks.length)
    let transfers = []

    for (let i = 0; i < chunks.length; i++) {
        results[i] = createChunkGeometry (chunks[i])
        transfers.push (results[i].buffers.vertexBuffer.buffer,
                        results[i].buffers.colorBuffer.buffer,
                        results[i].buffers.blockFaceBuffer.buffer,
                        results[i].buffers.BFBIndicesForFaces.buffer,
                        results[i].buffers.blockIndicesForFaces.buffer,
                        results[i].buffers.blockIndicesForBFBOffsets.buffer,
                        results[i].buffers.BFBOffsetsForBlocks.buffer) }

    self.postMessage ({ message: "createChunkGeometry", chunks: results }, transfers) }


function createChunkGeometry ({ position, blocks, neighborSides }) {
    let vertexIndex = 0
    let BFBIndex = 0
    BFBOffsetsForBlocks.fill (-1)

    // Loop over all the blocks in this chunk
    for (let blockIndex = 0; blockIndex < CHUNK_VOLUME; blockIndex++) {
        if (blocks[blockIndex]) {
            const block = Blocks.fromBlockID (blocks[blockIndex])
            const position = getPositionForBlockIndex (blockIndex)
            let blockHasVisibleFaces = false
            faceIndices.fill (-1)

            // Loop over all adjacent positions and add faces on sides without solid neighbors
            for (let i = 0; i < Directions.All.length; i++) {
                const direction = Directions.All[i]
                const adjacentPosition = direction.getAdjacentPosition (position)
                const adjacentBlock = do {
                    if (positionIsWithinChunk (adjacentPosition))
                         blocks[getBlockIndexForPosition (adjacentPosition)]
                    else if (neighborSides[i])
                         neighborSides[i][getNeighborIndexForPosition (adjacentPosition)]
                    else 0 }

                if (!adjacentBlock) {
                    for (let j = 0; j < 2; j++) { // Loop twice because we need two faces per side
                        const faceIndex = vertexIndex / 9 + j
                        const faceBFBIndex = i * 2 + j

                        faceIndices[faceBFBIndex] = faceIndex
                        BFBIndicesForFaces[faceIndex] = faceBFBIndex
                        blockIndicesForFaces[faceIndex] = blockIndex
                        colorBuffer.set (block.colorData[i], vertexIndex + j * 9) }

                    vertexBuffer.set (getVerticesForSide (position, direction), vertexIndex)
                    vertexIndex += 18
                    blockHasVisibleFaces = true }}

            // If this block has any visible faces, we'll add it to the BFB
            if (blockHasVisibleFaces) {
                blockFaceBuffer.set (faceIndices, BFBIndex)
                blockIndicesForBFBOffsets[BFBIndex / 12] = blockIndex
                BFBOffsetsForBlocks[blockIndex] = BFBIndex
                BFBIndex += 12 }}}

    // Copy and slice all our buffers down to the correct sizes
    const bufferSize = nextPowerOf2 (vertexIndex / 3) * 3
    const blockFaceBufferSize = nextPowerOf2 (BFBIndex / 3) * 3
    const buffers =
        { vertexBuffer:              vertexBuffer.slice (0, bufferSize),
          colorBuffer:               colorBuffer.slice (0, bufferSize),
          blockFaceBuffer:           blockFaceBuffer.slice (0, blockFaceBufferSize),
          BFBIndicesForFaces:        BFBIndicesForFaces.slice (0, bufferSize),
          blockIndicesForFaces:      blockIndicesForFaces.slice (0, bufferSize),
          blockIndicesForBFBOffsets: blockIndicesForBFBOffsets.slice (0, blockFaceBufferSize / 12),
          BFBOffsetsForBlocks:       BFBOffsetsForBlocks.slice () }

    return { position, buffers, vertexBufferSize: vertexIndex, blockFaceBufferSize: BFBIndex }}
