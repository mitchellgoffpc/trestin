import * as Three from 'three'

import Entity from 'entities'
import Pivot from 'entities/geometry/pivot'
import BaseConnection from 'physics/machinery/connection/base'
import BeamConnection from 'physics/machinery/connection/beam'

import M from 'util/math'
import GeometryBuilder from 'util/geometry'


export default class Piston extends Entity {
    needsPhysicsBody = false
    needsGameTick = false
    backstroke = false
    connections = {
        base: new BaseConnection (this),
        head: new BeamConnection (this) }

    createMesh () {
        const builder = new GeometryBuilder ()
        const piston = builder.addSubgroup ({ y: 1.6 })
        this.piston = piston.getMesh ()

        builder.addCylinder ({ y: 1.5, r: .5, h: 2, color: 0xDDAA33 })
        builder.addCylinder ({ y: 2.5, r: .2, h: .1, color: 0xDDAA33 })
        piston.addCylinder ({ r: .1, h: 2, color: 0xAAAAAA })
        piston.addMesh ({ y: 1, mesh: Pivot.createMesh (0xAAAAAA, 0xFF2211) })

        return builder.getMesh () }

    getEffectiveMass (connection) {
        return 1 }

    getAcceleration (connection) {
        let deltaV = this.getPistonForce () * 1
        if (connection !== this.connections.base) {
            deltaV += this.connections.base.getAcceleration (this) }
        if (connection !== this.connections.head) {
            deltaV += this.connections.head.getAcceleration (this) }
        return deltaV }

    updatePosition (connection, position) {
        let basePosition
        if (connection === this.connections.base) {
            this.connections.head.updatePosition (this, position)
            basePosition = position }
        else if (connection === this.connections.head) {
            this.connections.base.updatePosition (this, position)
            basePosition = this.connections.base.position }

        if (!this.backstroke && basePosition > 1.5 ||
             this.backstroke && basePosition < 0) {
            this.backstroke = !this.backstroke }
        if (basePosition > 1.5 || basePosition < 0) {
            throw new Error ("Bounced") }

        this.piston.position.setY (M.clamp (basePosition, 0, 1.5) + 1.6) }

    getPistonForce = () => do {
        if (!this.backstroke && this.connections.base.position < 1)
             0.0002
        else if (this.backstroke && this.connections.base.position > 0.5)
             -0.0002
        else 0 }
}
