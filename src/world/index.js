import _ from 'lodash'
import * as Three from 'three'
import SimplexNoise from 'simplex-noise'

import Entity from 'entities'
import Chunk from 'world/chunk'
import PhysicsEngine from 'physics/engine'
import MachineryEngine from 'physics/machinery/engine'
import Shapes from 'util/shapes'


export default class World {
    scene = new Three.Scene ()
    raycaster = new Three.Raycaster ()
    noise = new SimplexNoise('seed')
    physics = new PhysicsEngine ()
    machinery = new MachineryEngine ()

    entities = {}
    chunks = {}

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
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                this.chunks[`${x},0,${z}`] = new Chunk (x, 0, z, this.noise, this.scene, this.physics) }}

        // Add event handlers
        this.streams.timer.onValue (dt => this.physics.step (dt))
        this.streams.timer.onValue (dt => this.machinery.step (dt))
        this.physics.onStep (({ entities }) =>
            _.forEach (entities, ({ x, y, z }, uuid) => {
                this.entities[uuid].mesh.position.set (x, y, z) })) }

    // Methods for creating blocks and entities

    placeBlock = (x, y, z, block) => {
        const chunk = this.getChunkForPosition (x, y, z)
        if (chunk) {
            const coord = i => i >= 0 ? i % 16 : i % 16 + 16
            const { mesh, body } = chunk.placeBlock (coord(x), coord(y), coord(z), { block })
            this.scene.add (mesh)
            this.physics.addBlock (body, x, y, z) }}

    placeMachine = (x, y, z, machine) => {
        this.placeBlock (x, y, z, machine)
        this.machinery.addMachine (machine) }

    // Methods for destroying blocks and entities

    destroyBlock = block => {
        const { x, y, z } = block.position
        const chunk = this.getChunkForPosition (x, y, z)
        if (chunk && y > 0) {
            const { mesh, body } = chunk.destroyBlock (block.uuid)
            this.scene.remove (mesh)
            this.physics.removeBlock (body) }}

    destroyEntity = entity => {
        this.scene.remove (entity.mesh)
        this.physics.removeEntity (entity.body)
        delete this.entities[entity.uuid] }

    // Helper methods

    getChunkForPosition = (x, y, z) => {
        const cx = Math.floor (x / 16)
        const cy = Math.floor (y / 16)
        const cz = Math.floor (z / 16)

        return this.chunks[`${cx},${cy},${cz}`] }

    getBlockForFaceIndex = (faceIndex, x, y, z) => {
        const chunk = this.getChunkForPosition (x, y, z)
        const [cx, cy, cz] = chunk.getBlockForFaceIndex (faceIndex)
        return chunk.getWorldPosFromChunkPos (cx, cy, cz).join (",") }

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
        _.chain  (this.getIntersections (position, direction))
         .sortBy ('distance')
         .first  ()
         .value  ()

    setBlockHighlight = (x, y, z, highlight) => {
        const chunk = this.getChunkForPosition (x, y, z)
        const [cx, cy, cz] = chunk.getChunkPosFromWorldPos (x, y, z)
        chunk.setBlockHighlight (cx, cy, cz, highlight) }
}
