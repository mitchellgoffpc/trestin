import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import BaseConnection from 'physics/machinery/connection/base'
import BeamConnection from 'physics/machinery/connection/beam'
import GeometryBuilder from 'util/geometry'


export default class Counterweight extends Machine {
    connections = {
        base: new BaseConnection (this),
        beam: new BeamConnection (this) }

    createMesh () {
        const builder = new GeometryBuilder ()
        const beam = builder.addSubgroup ({ y: 3.7 })
        const weight = builder.addSubgroup ({ x: 3, y: 3.7 })
        this.beam = beam.getMesh ()
        this.weight = weight.getMesh ()

        builder.addBox ({ dx: .2, dy: 4, dz: .2, y: 1.35, color: 0xDDAA33 })
        builder.addMesh ({ y: 3.35, mesh: Pivot.createMesh (0xDDAA33, 0xAAAAAA) })
        beam.addCylinder ({ r: .1, h: 7, rz: Math.PI / 2, color: 0xAAAAAA })
        weight.addBox ({ dx: 1, dy: 1, dz: 1, y: -2, color: 0x666666 })
        weight.addCylinder ({ r: .01, h: 2, y: -1, faces: 6, color: 0xAAAAAA })

        return builder.getMesh () }

    getEffectiveMass (connection) {
        return 1 }

    getAcceleration (connection) {
        let deltaV = 0.0001
        if (connection !== this.connections.base) {
            deltaV += this.connections.base.getAcceleration (this) }
        if (connection !== this.connections.beam) {
            deltaV += this.connections.beam.getAcceleration (this) }
        return deltaV }

    checkPosition = (connection, position) => do {
        if (connection === this.connections.base)
            Math.abs (position) <= Math.PI / 4 &&
            this.connections.beam.checkPosition (this, -Math.tan (position) * 3 - .75)
        else if (connection === this.connections.beam)
            Math.abs (Math.atan ((position - .75) / 3)) <= Math.PI / 4 &&
            this.connections.base.checkPosition (this, -Math.atan ((position - .75) / 3)) }

    updatePosition (connection, position) {
        if (connection === this.connections.base) {
            this.connections.beam.updatePosition (this, -Math.tan (position) * 3 - .75) }
        else if (connection === this.connections.beam) {
            this.connections.base.updatePosition (this, -Math.atan ((position - .75) / 3)) }

        this.beam.rotation.z = this.connections.base.position
        this.weight.position.set (Math.cos (this.connections.base.position) * 3,
                                  Math.sin (this.connections.base.position) * 3 + 3.7, 0) }}
