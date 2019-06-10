import _ from 'lodash'
import * as Three from 'three'

import Entity from 'entities'
import Chunk from 'world/chunk'
import PhysicsEngine from 'physics/engine'
import MachineryEngine from 'physics/machinery/engine'

import Crank from 'blocks/machines/crank'
import Piston from 'blocks/machines/piston'
import WalkingBeam from 'blocks/machines/walking-beam'
import Counterweight from 'blocks/machines/counterweight'

import Shapes from 'util/shapes'


export default class World {
    scene = new Three.Scene ()
    raycaster = new Three.Raycaster ()
    physics = new PhysicsEngine ()
    machinery = new MachineryEngine ()

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

        // Create some shapes for testing the physics engine
        const sphere   = new Entity ({ shape: Shapes.SPHERE, color: 0xFFAA88, mass: 0.1, radius: 1 })
        const box      = new Entity ({ shape: Shapes.BOX, color: 0xFFAA88, mass: 1, x: 3, y: 3, z: 3 })
        const cylinder = new Entity ({ shape: Shapes.CYLINDER, color: 0xFFAA88, mass: 1, radius: 2, height: 2 })

        sphere.spawn   (this, 0, 10, 0)
        box.spawn      (this, 8, 10, -8)
        cylinder.spawn (this, -8, 10, -8)

        // Create some machines for testing the machinery engine
        const pistonA = new Piston (0.0002)
        const pistonB = new Piston (0.0002)
        const counterweight = new Counterweight ()
        const walkingBeam = new WalkingBeam ()
        const crank = new Crank ()

        this.placeBlock (5, 1, 0)
        this.placeBlock (5, 1, -3)
        this.placeMachine (5, 1, 0, pistonA)
        this.placeMachine (5, 1, -3, pistonB)
        this.placeMachine (8, 1, 0, counterweight)
        this.placeMachine (8, 1, -3, walkingBeam)
        this.placeMachine (11, 1, -3, crank)

        this.machinery.connect (pistonA.connections.head, counterweight.connections.beam)
        this.machinery.connect (pistonB.connections.head, walkingBeam.connections.left)
        this.machinery.connect (walkingBeam.connections.right, crank.connections.crankshaft)

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

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
        _.chain  (this.getIntersections (position, direction))
         .sortBy ('distance')
         .first  ()
         .value  ()
}
