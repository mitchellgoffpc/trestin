import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import BaseConnection from 'physics/machinery/connection/base'
import BeamConnection from 'physics/machinery/connection/beam'
import GeometryBuilder from 'util/geometry'


export default class Piston extends Machine {
    backstroke = false
    connections = {
        base: new BaseConnection (this),
        head: new BeamConnection (this) }

    constructor (force) {
        super ()
        this.force = force }

    createMesh () {
        const builder = new GeometryBuilder ()
        const piston = builder.addSubgroup ({ y: 1.6 })
        this.piston = piston.getMesh ()

        builder.addCylinder ({ r: .5, h: 2, y: 1.5, color: 0xDDAA33 })
        builder.addCylinder ({ r: .2, h: .1, y: 2.5, color: 0xDDAA33 })
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

    getPistonForce = () => do {
        if (!this.backstroke && this.connections.base.position < 1)
             this.force
        else if (this.backstroke && this.connections.base.position > 0.5)
             -this.force
        else 0 }

    checkPosition = (connection, position) => do {
        if (connection === this.connections.base)
            position <= 1.5 && position >= 0 && this.connections.head.checkPosition (this, position)
        else if (connection === this.connections.head)
            position <= 1.5 && position >= 0 && this.connections.base.checkPosition (this, position) }

    updatePosition (connection, position) {
        if (connection === this.connections.base) {
            this.connections.head.updatePosition (this, position) }
        else if (connection === this.connections.head) {
            this.connections.base.updatePosition (this, position) }

        const basePosition = this.connections.base.position
        if (!this.backstroke && basePosition > 1.4 ||
             this.backstroke && basePosition < 0.1) {
            this.backstroke = !this.backstroke }

        this.piston.position.setY (basePosition + 1.6) }}
