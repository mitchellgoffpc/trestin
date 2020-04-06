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
    const results = map (chunks, createChunkGeometry)
    const transfers = flatMap (results, chunk => map (chunk.buffers, 'buffer'))
    self.postMessage ({ message: "createChunkGeometry", chunks: results }, transfers) }

function createChunkGeometry ({ position, blocks, neighbors }) {
    let vertexIndex = 0
    let BFBIndex = 0
    BFBOffsetsForBlocks.fill (-1)

    for (let blockIndex = 0; blockIndex < CHUNK_VOLUME; blockIndex++) {
        if (blocks[blockIndex]) {
            const block = Blocks.fromBlockID (blocks[blockIndex])
            const position = getPositionForBlockIndex (blockIndex)
            let blockHasVisibleFaces = false
            faceIndices.fill (-1)

            for (let i = 0; i < 6; i++) {
                const direction = Directions.All[i]
                const adjacentPosition = direction.getAdjacentPosition (position)
                const adjacentBlock = do {
                    if (positionIsWithinChunk (adjacentPosition))
                         blocks[getBlockIndexForPosition (adjacentPosition)]
                    else neighbors[direction][getNeighborIndexForPosition (adjacentPosition)] }

                if (!adjacentBlock) {
                    for (let i = 0; i < 2; i++) { // Loop twice because we need two faces per side
                        const faceIndex = vertexIndex / 9 + i
                        const faceBFBIndex = direction.index * 2 + i

                        faceIndices[faceBFBIndex] = faceIndex
                        BFBIndicesForFaces[faceIndex] = faceBFBIndex
                        blockIndicesForFaces[faceIndex] = blockIndex
                        colorBuffer.set (block.colorData[direction.index], vertexIndex + i * 9) }

                    vertexBuffer.set (getVerticesForSide (position, direction), vertexIndex)
                    vertexIndex += 18
                    blockHasVisibleFaces = true }}

            if (blockHasVisibleFaces) {
                blockFaceBuffer.set (faceIndices, BFBIndex)
                blockIndicesForBFBOffsets[BFBIndex / 12] = blockIndex
                BFBOffsetsForBlocks[blockIndex] = BFBIndex
                BFBIndex += 12 }}}

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
