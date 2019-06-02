import * as Three from 'three'

import Entity from 'entities'
import Pivot from 'entities/geometry/pivot'
import BaseConnection from 'physics/machinery/connection/base'
import BeamConnection from 'physics/machinery/connection/beam'

import M from 'util/math'
import GeometryBuilder from 'util/geometry'


export default class Counterweight extends Entity {
    needsPhysicsBody = false
    connections = {
        base: new BaseConnection (this),
        beam: new BeamConnection (this) }

    createMesh () {
        const builder = new GeometryBuilder ()
        const beam = builder.addSubgroup ({ y: 3.7 })
        const weight = builder.addSubgroup ({ x: 3, y: 3.7 })
        this.beam = beam.getMesh ()
        this.weight = weight.getMesh ()

        builder.addBox ({ dx: .2, dy: 6, dz: .2, y: .35, color: 0xDDAA33 })
        builder.addMesh ({ y: 3.35, mesh: Pivot.createMesh (0xDDAA33, 0xAAAAAA) })
        beam.addCylinder ({ r: .1, h: 7, rz: Math.PI / 2, color: 0xAAAAAA })
        weight.addBox ({ dx: 1, dy: 1, dz: 1, y: -2, color: 0x666666 })
        weight.addCylinder ({ r: .01, h: 2, y: -1, faces: 6, color: 0xAAAAAA })

        return builder.getMesh () }

    getEffectiveMass (connection) {
        return 1 }

    getAcceleration (connection) {
        return 0.0001 }

    updatePosition (connection, position) {
        if (connection === this.connections.base) {
            this.connections.beam.updatePosition (this, -Math.tan (position) * 3 - .75) }
        else if (connection === this.connections.beam) {
            this.connections.base.updatePosition (this, -Math.atan ((position - .75) / 3)) }

        this.beam.rotation.z = M.clamp (this.connections.base.position, -Math.PI / 4, Math.PI / 4)
        this.weight.position.set (Math.cos (this.beam.rotation.z) * 3,
                                  Math.sin (this.beam.rotation.z) * 3 + 3.7, 0) }}
