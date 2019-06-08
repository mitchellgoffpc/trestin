import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import BeamConnection from 'physics/machinery/connection/beam'
import GeometryBuilder from 'util/geometry'


export default class WalkingBeam extends Machine {
    connections = {
        left:  new BeamConnection (this),
        right: new BeamConnection (this) }

    createMesh () {
        const builder = new GeometryBuilder ()
        const beam = builder.addSubgroup ({ y: 3.7 })
        this.beam = beam.getMesh ()

        builder.addBox ({ dx: .2, dy: 3, dz: .2, y: 1.85, color: 0xDDAA33 })
        builder.addMesh ({ y: 3.35, mesh: Pivot.createMesh (0xDDAA33, 0xAAAAAA) })
        beam.addCylinder ({ r: .1, h: 7, rz: Math.PI / 2, color: 0xAAAAAA })

        return builder.getMesh () }

    getEffectiveMass (connection) {
        return 1 }

    getAcceleration (connection) {
        let deltaV = 0
        if (connection !== this.connections.left) {
            deltaV += this.connections.left.getAcceleration (this) }
        if (connection !== this.connections.right) {
            deltaV += this.connections.right.getAcceleration (this) }
        return deltaV }

    checkPosition = (connection, position) => do {
        if (connection === this.connections.left)
            position >= 0 && position <= 2 && this.connections.right.checkPosition (this, position)
        else if (connection === this.connections.right)
            position >= 0 && position <= 2 && this.connections.left.checkPosition (this, position) }

    updatePosition (connection, position) {
        if (connection === this.connections.left) {
            this.connections.right.updatePosition (this, 2 - position) }
        else if (connection === this.connections.right) {
            this.connections.left.updatePosition (this, 2 - position) }

        this.beam.rotation.z = -Math.atan ((this.connections.left.position - .75) / 3) }}
