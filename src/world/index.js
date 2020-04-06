import * as Three from 'three'

import map from 'lodash-es/map'
import chunk from 'lodash-es/chunk'
import first from 'lodash-es/first'
import range from 'lodash-es/range'
import filter from 'lodash-es/filter'
import negate from 'lodash-es/negate'
import values from 'lodash-es/values'
import sortBy from 'lodash-es/sortBy'
import flatMap from 'lodash-es/flatMap'
import fromPairs from 'lodash-es/fromPairs'
import mapValues from 'lodash-es/mapValues'

import Entity from 'entities'
import Chunk from 'world/chunk'
import TerrainWorker from 'world/terrain.worker'
import GeometryWorker from 'world/geometry.worker'
import PhysicsEngine from 'physics/engine'
import MachineryEngine from 'physics/machinery/engine'

import Shapes from 'util/shapes'
import Directions from 'util/directions'

const RENDER_DISTANCE = 20


// Helper functions

const coord = i =>
    i >= 0 ? i % 16 : i % 16 + 16

const coords = (x, y, z) =>
    `${x},${y},${z}`

const getChunkPosition = ({ x, y, z }) =>
    ({ x: coord (x), y: coord (y), z: coord (z) })


// World class

export default class World {
    scene = new Three.Scene ()
    raycaster = new Three.Raycaster ()
    physics = new PhysicsEngine ()
    machinery = new MachineryEngine ()
    terrainWorker = new TerrainWorker ()
    geometryWorker = new GeometryWorker ()

    chunks = {}
    entities = {}
    chunksLoaded = 0

    constructor (streams) {
        this.streams = streams
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.fog = new Three.Fog (0xADCCFF, (RENDER_DISTANCE - 5) * 16, (RENDER_DISTANCE - 1) * 16)
        this.scene.add (new Three.AmbientLight (0x404040))

        const northLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        const southLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        northLight.position.set (100, 100, 50)
        southLight.position.set (-100, 100, -50)
        this.scene.add (northLight)
        this.scene.add (southLight)

        // Add event handlers
        this.terrainWorker.addEventListener ("message", this.handleTerrainWorkerMessage)
        this.geometryWorker.addEventListener ("message", this.handleGeometryWorkerMessage)
        this.physics.onStep (this.handleEntityUpdate)

        // Generate chunks for the spawn area
        for (let x = -RENDER_DISTANCE - 1; x <= RENDER_DISTANCE + 1; x++) { - 1
            for (let z = -RENDER_DISTANCE - 1; z <= RENDER_DISTANCE + 1; z++) {
                this.createChunkTerrain (range (-RENDER_DISTANCE - 1, RENDER_DISTANCE + 1) .map (y => ({ x, y, z }))) }}}


    // API methods for workers

    createChunkTerrain = positions =>
        this.terrainWorker.postMessage ({ message: 'createChunkTerrain', positions })

    createChunkGeometry = (chunks, buffers) =>
        this.geometryWorker.postMessage ({ message: 'createChunkGeometry', chunks }, buffers)


    // Event listeners for worker messages

    handleTerrainWorkerMessage = ({ data }) => {
        let chunksToRender = []

        data.chunks.forEach (({ x, y, z, blocks }) => {
            const chunk = new Chunk (x, y, z, blocks, this)
            this.chunks[coords (x, y, z)] = chunk

            const adjacentChunks =
                Directions.All.map (direction => direction.getAdjacentPosition ({ x, y, z }))
                              .map (this.getChunkForCoords)
                              .filter (x => x)

            chunk.loadedNeighbors = adjacentChunks.length
            adjacentChunks.forEach (chunk => { chunk.loadedNeighbors += 1 })

            adjacentChunks.filter (this.shouldCreateGeometryForChunk)
                          .forEach (chunk => chunksToRender.push (chunk)) })

        if (chunksToRender.length) {
            const chunks = map (chunksToRender, chunk => ({ position: chunk.position, blocks: chunk.blocks, neighbors: this.getNeighborData (chunk) }))
            const transfers = flatMap (chunks, chunk => map (chunk.neighbors, 'buffer'))
            this.createChunkGeometry (chunks, transfers) }}

    handleGeometryWorkerMessage = ({ data }) => {
        if (data.message === 'createChunkGeometry') {
            this.chunksLoaded += data.chunks.length

            data.chunks.forEach (({ position, buffers, vertexBufferSize, blockFaceBufferSize }) => {
                const chunk = this.chunks[coords (position.x, position.y, position.z)]
                chunk.createBufferGeometry (buffers, vertexBufferSize, blockFaceBufferSize) }) }}

    handleEntityUpdate = ({ entities }) => {
        entities.forEach (({ uuid, x, y, z }) => {
            this.entities[uuid].mesh.position.set (x, y, z) }) }


    // Methods for loading and unloading chunks

    loadChunks (positions) {
        this.createChunkTerrain (positions.filter (negate (this.getChunkForCoords))) }

    unloadChunks (positions) {
        filter (positions.map (this.getChunkForCoords)) .forEach (chunk => {
            Directions.All.forEach (direction => {
                const neighbor = this.getChunkForCoords (direction.getAdjacentPosition (chunk.position))
                if (neighbor) {
                    neighbor.loadedNeighbors -= 1
                    if (neighbor.mesh) { this.unloadChunkGeometry (neighbor) }}})

            delete this.chunks[coords (chunk.position.x, chunk.position.y, chunk.position.z)] }) }

    unloadChunkGeometry (chunk) {
        chunk.mesh.geometry.dispose ()
        chunk.mesh.material.dispose ()
        this.scene.remove (chunk.mesh) }


    // Methods for creating blocks and entities

    placeBlock (position, block) {
        this.withChunk (position, (chunk, chunkPos) => chunk.placeBlock (chunkPos, block)) }

    placeBlockOnChunkFace (position, faceIndex, block) {
        this.withChunk (position, chunk => chunk.placeBlockOnFace (faceIndex, block)) }

    placeMachine (position, machine) {
        this.placeBlock (position, machine)
        this.machinery.addMachine (machine) }

    spawnEntity ({ x, y, z }, entity) {
        entity.mesh.position.set (x, y, z)
        this.scene.add (entity.mesh)
        this.entities[entity.uuid] = entity

        if (entity.needsPhysicsBody) {
            this.physics.addEntity (x, y, z, entity.uuid, entity.properties) }
        if (entity.needsGameTick) {
            this.streams.timer.onValue (() => entity.tick()) }}


    // Methods for destroying blocks and entities

    destroyBlock (position) {
        this.withChunk (position, (chunk, chunkPos) => chunk.destroyBlock (chunkPos)) }

    destroyBlockWithFace (position, faceIndex) {
        this.withChunk (position, chunk => chunk.destroyBlockWithFace (faceIndex)) }

    destroyEntity (entity) {
        this.scene.remove (entity.mesh)
        this.physics.removeEntity (entity.uuid)
        delete this.entities[entity.uuid] }


    // Methods for adding and removing block faces

    createBlockFace (position, direction) {
        this.withChunk (position, (chunk, chunkPos) => chunk.createBlockFace (chunkPos, direction)) }

    removeBlockFace (position, direction) {
        this.withChunk (position, (chunk, chunkPos) => chunk.removeBlockFace (chunkPos, direction)) }


    // Miscellaneous helper methods

    getChunkForCoords = ({ x, y, z }) =>
        this.chunks[coords (x, y, z)]

    getChunkForPosition = ({ x, y, z }) =>
        this.chunks[coords (Math.floor (x / 16), Math.floor (y / 16), Math.floor (z / 16))]

    getBlockAtPosition = position =>
        this.withChunk (position, (chunk, chunkPos) => chunk.getBlockAtPosition (chunkPos)) || 0

    getBlockPositionForFaceIndex = (position, faceIndex) =>
        this.withChunk (position, chunk => chunk.getWorldPosFromChunkPos (chunk.getBlockPositionForFaceIndex (faceIndex)))

    getIntersections (position, direction) {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
         first (sortBy (this.getIntersections (position, direction), 'distance'))

    getNeighborData = chunk =>
        mapValues (Directions.ByName, direction =>
            this.getChunkForCoords (direction.getAdjacentPosition (chunk.position))
                .getNeighborData (direction.opposite))

    setBlockHighlight (position, highlight) {
        this.withChunk (position, (chunk, chunkPos) => chunk.setBlockHighlight (chunkPos, highlight)) }

    shouldCreateGeometryForChunk = chunk =>
        chunk.blocks && chunk.loadedNeighbors === 6

    withChunk (position, callback) {
        const chunk = this.getChunkForPosition (position)
        if (chunk) { return callback (chunk, chunk.getChunkPosFromWorldPos (position)) }}}
