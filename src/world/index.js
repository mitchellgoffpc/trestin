import _ from 'lodash'
import * as Three from 'three'
import SimplexNoise from 'simplex-noise'

import Entity from 'entities'
import Chunk from 'world/chunk'
import PhysicsEngine from 'physics/engine'
import MachineryEngine from 'physics/machinery/engine'
import Shapes from 'util/shapes'
import { coords, getCoordsForPosition, getPositionForCoords } from 'util/coordinates'

// Helper functions

const coord = i =>
    i >= 0 ? i % 16 : i % 16 + 16

const getChunkPosition = ({ x, y, z }) =>
    ({ x: coord (x), y: coord (y), z: coord (z) })


// World class

export default class World {
    scene = new Three.Scene ()
    raycaster = new Three.Raycaster ()
    noise = new SimplexNoise('seed')
    physics = new PhysicsEngine ()
    machinery = new MachineryEngine ()

    chunks = {}
    entities = {}

    constructor (streams) {
        this.streams = streams
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.add (new Three.AmbientLight (0x404040))

        const northLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        const southLight = new Three.DirectionalLight (0xFFFFFF, 0.5)
        northLight.position.set (100, 100, 50)
        southLight.position.set (-100, 100, -50)
        this.scene.add (northLight)
        this.scene.add (southLight)

        // Spawn a bunch of chunks at level y = 0
        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                this.chunks[`${x},0,${z}`] = new Chunk (x, 0, z, this.noise, this.scene, this.physics) }}

        // Add event handlers
        this.streams.draw.onValue (dt => this.physics.step (dt))
        this.streams.draw.onValue (dt => this.machinery.step (dt))
        this.physics.onStep (({ entities }) =>
            _.forEach (entities, ({ x, y, z }, uuid) => {
                this.entities[uuid].mesh.position.set (x, y, z) })) }

    // Methods for creating blocks and entities

    placeBlockOnChunkFace = (position, faceIndex, block) => {
        const chunk = this.getChunkForPosition (position)
        if (chunk) { chunk.placeBlockOnFace (faceIndex, block) }}

    placeBlock = (position, block) => {
        const chunk = this.getChunkForPosition (position)
        if (chunk) {
            chunk.placeBlock (getChunkPosition (position), block)
            this.physics.addBlock (position.x, position.y, position.z, block.uuid) }}

    placeMachine = (position, machine) => {
        this.placeBlock (position, machine)
        this.machinery.addMachine (machine) }

    spawnEntity = ({ x, y, z }, entity) => {
        entity.mesh.position.set (x, y, z)
        this.scene.add (entity.mesh)
        this.entities[entity.uuid] = entity

        if (entity.needsPhysicsBody) {
            this.physics.addEntity (x, y, z, entity.uuid, entity.properties) }
        if (entity.needsGameTick) {
            this.streams.timer.onValue (() => entity.tick()) }}


    // Methods for destroying blocks and entities

    destroyBlock = block => {
        const chunk = this.getChunkForPosition (block.position)
        if (chunk && block.position.y > 0) {
            const { mesh } = chunk.destroyBlock (block.uuid)
            this.scene.remove (mesh)
            this.physics.removeBlock (block.uuid) }}

    destroyBlockWithFace = (position, faceIndex) => {
        const chunk = this.getChunkForPosition (position)
        if (chunk) { chunk.destroyBlockWithFace (faceIndex) }}

    destroyEntity = entity => {
        this.scene.remove (entity.mesh)
        this.physics.removeEntity (entity.uuid)
        delete this.entities[entity.uuid] }

    // Helper methods

    getChunkForPosition = ({ x, y, z }) =>
        this.chunks[coords (Math.floor (x / 16), Math.floor (y / 16), Math.floor (z / 16))]

    getBlockPositionForFaceIndex = (position, faceIndex) => {
        const chunk = this.getChunkForPosition (position)
        return chunk.getWorldPosFromChunkPos (getPositionForCoords (chunk.faceIndexPositions[faceIndex])) }

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
        _.chain  (this.getIntersections (position, direction))
         .sortBy ('distance')
         .first  ()
         .value  ()

    setBlockHighlight = (position, highlight) => {
        const chunk = this.getChunkForPosition (position)
        chunk.setBlockHighlight (chunk.getChunkPosFromWorldPos (position), highlight) }
}
