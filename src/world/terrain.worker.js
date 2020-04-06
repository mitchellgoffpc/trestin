import SimplexNoise from 'simplex-noise'
import map from 'lodash-es/map'
import filter from 'lodash-es/filter'

import Blocks from 'blocks'
import { getBlockIndex } from 'util/coordinates'


// Constants

const noise = new SimplexNoise ('seed')


// Attach the message listener

self.addEventListener ("message", ({ data }) => {
    if (data.message === "createChunkTerrain") { createChunkTerrainForBatch (data) }})


// API functions

function createChunkTerrainForBatch ({ positions }) {
    const chunks = positions.map (position => ({ ...position, blocks: createChunkTerrain (position) }))
    const transfers = map (filter (chunks, 'blocks'), chunk => chunk.blocks.buffer)
    self.postMessage ({ message: "createChunkTerrain", chunks }, transfers) }

function createChunkTerrain ({ x, y, z }) {
    const blocks = new Int32Array (16 * 16 * 16)
    let chunkContainsBlocks = false

    for (let bx = 0; bx < 16; bx++) {
        for (let bz = 0; bz < 16; bz++) {
            const elevation =
                Math.floor ((noise.noise2D ((x * 16 + bx) / 64,  (z * 16 + bz) / 64) / 2 + .5) * 8) +
                Math.floor ((noise.noise2D ((x * 16 + bx) / 256, (z * 16 + bz) / 256) / 2 + .5) * 64) -
                y * 16

            for (let by = 0; by <= elevation && by < 16; by++) {
                blocks[getBlockIndex (bx, by, bz)] = by >= elevation - 1 ? Blocks.Grass.ID : Blocks.Dirt.ID
                chunkContainsBlocks = true }}}

    return chunkContainsBlocks ? blocks : null }
