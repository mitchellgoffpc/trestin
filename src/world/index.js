import _ from 'lodash'
import * as Three from 'three'
import SimplexNoise from 'simplex-noise'

import Entity from 'entities'
import Chunk from 'world/chunk'
import PhysicsEngine from 'physics/engine'
import MachineryEngine from 'physics/machinery/engine'
import Shapes from 'util/shapes'
import { getCoordsForPosition, getPositionForCoords } from 'util/coordinates'

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
    noise = new SimplexNoise ('seed')
    physics = new PhysicsEngine ()
    machinery = new MachineryEngine ()

    chunks = {}
    entities = {}

    constructor (streams) {
        this.streams = streams
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.fog = new Three.Fog (0xADCCFF, 180, 256)
        this.scene.add (new Three.AmbientLight (0x404040))

        const northLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        const southLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        northLight.position.set (100, 100, 50)
        southLight.position.set (-100, 100, -50)
        this.scene.add (northLight)
        this.scene.add (southLight)

        // Spawn a bunch of chunks at level y = 0
        for (let x = -16; x <= 16; x++) {
            for (let z = -16; z <= 16; z++) {
                for (let y = 0; y <= 5; y++) {
                    this.loadChunk (x, y, z) }}}

        for (let position in this.chunks) {
            this.chunks[position].createBufferGeometry () }

        // Add event handlers
        // this.streams.step.onValue (dt => this.physics.step (dt))
        // this.streams.step.onValue (dt => this.machinery.step (dt))
        // this.physics.onStep (({ entities }) =>
        //     _.forEach (entities, ({ x, y, z }, uuid) => {
        //         this.entities[uuid].mesh.position.set (x, y, z) })) }
    }


    // Methods for loading and unloading chunks
    loadChunk (x, y, z) {
        if (!this.chunks[coords (x, y, z)])
            this.chunks[coords (x, y, z)] = new Chunk (x, y, z, this) }

    unloadChunk (x, y, z) {
        const chunk = this.chunks[coords (x, y, z)]
        if (chunk) {
            chunk.mesh.geometry.dispose ()
            chunk.mesh.material.dispose ()
            this.scene.remove (chunk.mesh)
            delete this.chunks[coords (x, y, z)] }}


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

    getChunkForPosition = ({ x, y, z }) =>
        this.chunks[coords (Math.floor (x / 16), Math.floor (y / 16), Math.floor (z / 16))]

    getBlockAtPosition = position => do {
        const chunk = this.getChunkForPosition (position)
        if (chunk && chunk.blocks)
             chunk.blocks[getCoordsForPosition (chunk.getChunkPosFromWorldPos (position))]
        else 0 }

    getBlockPositionForFaceIndex = (position, faceIndex) => {
        const chunk = this.getChunkForPosition (position)
        return chunk.getWorldPosFromChunkPos (getPositionForCoords (chunk.blockIndicesForFaces[faceIndex])) }

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
         _.first (_.sortBy (this.getIntersections (position, direction), 'distance'))

    setBlockHighlight (position, highlight) {
        const chunk = this.getChunkForPosition (position)
        chunk.setBlockHighlight (chunk.getChunkPosFromWorldPos (position), highlight) }

    withChunk (position, callback) {
        const chunk = this.getChunkForPosition (position)
        if (chunk) { callback (chunk, chunk.getChunkPosFromWorldPos (position)) }}}
