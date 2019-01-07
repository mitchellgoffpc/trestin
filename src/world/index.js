import _ from 'lodash'
import * as Three from 'three'

import Chunk from 'world/chunk'
import Entity from 'world/entity'
import PhysicsEngine from 'physics'


export default class World {
    scene = new Three.Scene ()
    raycaster = new Three.Raycaster ()
    physics = new PhysicsEngine ()

    entities = {}
    chunks = {
        '0,0,0':   new Chunk (0, 0, 0, 0x2244FF),
        '0,0,-1':  new Chunk (0, 0, -1, 0xDDAA33),
        '-1,0,0':  new Chunk (-1, 0, 0, 0x22BB33),
        '-1,0,-1': new Chunk (-1, 0, -1, 0xFF2211) }

    constructor (streams) {
        this.streams = streams
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.add (new Three.AmbientLight (0x404040))
        _.forEach (this.chunks, chunk => chunk.populate (this.scene, this.physics))

        // Create a sphere for testing the physics engine
        this.createEntity (0, 10, 0, 1)

        // Add event handlers
        this.streams.timer.onValue (dt => this.physics.step (dt))
        this.physics.onStep (({ entities }) =>
            _.forEach (entities, ({ x, y, z }, uuid) => {
                this.entities[uuid].mesh.position.set (x, y, z) })) }

    // Methods for creating and destroying objects

    createBlock = (x, y, z) => {
        const chunk = this.getChunkForPosition (x, y, z)
        if (chunk) {
            const coord = i => i >= 0 ? i % 16 : i % 16 + 16
            const { mesh, body } = chunk.createBlock (coord(x), coord(y), coord(z))
            this.scene.add (mesh)
            this.physics.addBlock (body, x, y, z) }}

    destroyBlock = block => {
        const { x, y, z } = block.position
        const chunk = this.getChunkForPosition (x, y, z)
        if (chunk && y > 0) {
            const { mesh, body } = chunk.destroyBlock (block.uuid)
            this.scene.remove (mesh)
            this.physics.removeBlock (body) }}

    createEntity = (x, y, z, mass) => {
        const entity = new Entity (mass)
        entity.mesh.position.set (x, y, z)
        this.scene.add (entity.mesh)
        this.physics.addEntity (entity.body, x, y, z)
        this.entities[entity.uuid] = entity }

    // Helper methods

    getChunkForPosition = (x, y, z) => {
        const cx = Math.floor (x / 16)
        const cy = Math.floor (y / 16)
        const cz = Math.floor (z / 16)

        return this.chunks[`${cx},${cy},${cz}`] }

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
        _.chain  (this.getIntersections (position, direction))
         .sortBy ('distance')
         .first  ()
         .value  ()
}
