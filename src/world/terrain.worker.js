import SimplexNoise from 'simplex-noise'

import Blocks from 'blocks'
import Directions from 'util/directions'
import { getBlockIndex } from 'util/coordinates'


// Constants

const noise = new SimplexNoise ('seed')


// Attach the message listener

self.addEventListener ("message", ({ data }) => {
    if (data.message === "createChunkTerrain") { createChunkTerrainForBatch (data) }})


// API functions

function createChunkTerrainForBatch ({ positions }) {
    let chunks = new Array (positions.length)
    let transfers = []

    for (let i = 0; i < positions.length; i++) {
        const blocks = createChunkTerrain (positions[i].x, positions[i].y, positions[i].z)
        let sides = null, sidesAreSolid = null

        if (blocks) {
            sides = new Array (Directions.All.length)
            sidesAreSolid = new Array (Directions.All.length)

            transfers.push (blocks.buffer)
            for (let j = 0; j < Directions.All.length; j++) {
                const { side, isSolid } = createChunkFaceData (blocks, Directions.All[j])
                sides[j] = side, sidesAreSolid[j] = isSolid
                transfers.push (side.buffer) }}

        chunks[i] = { position: positions[i], blocks, sides, sidesAreSolid }}

    self.postMessage ({ message: "createChunkTerrain", chunks }, transfers) }


// Helper functions

function createChunkTerrain (x, y, z) {
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


function createChunkFaceData (blocks, direction) {
    const result = new Int32Array (16 * 16)
    const edge = direction.vector[direction.axis] === 1 ? 0xF : 0
    let isSolid = true

    if (direction.axis === 'x') {
        for (let y = 0; y < 16; y++) {
            for (let z = 0; z < 16; z++) {
                const block = blocks[getBlockIndex (edge, y, z)]
                if (!block) isSolid = false
                result[(y << 4) + z] = block }}}

    else if (direction.axis === 'y') {
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                const block = blocks[getBlockIndex (x, edge, z)]
                if (!block) isSolid = false
                result[(x << 4) + z] = block }}}

    else if (direction.axis === 'z') {
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                const block = blocks[getBlockIndex (x, y, edge)]
                if (!block) isSolid = false
                result[(x << 4) + y] = block }}}

    return { side: result, isSolid }}
