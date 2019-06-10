import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import LinearConnection from 'physics/machinery/connections/linear'
import GeometryBuilder from 'util/geometry'


export default class Piston extends Machine {
    backstroke = false
    connections = {
        head: new LinearConnection (this) }

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

    getBaseForce = position => do {
        if (!this.backstroke && position < 1)
             this.force
        else if (this.backstroke && position > 0.5)
             -this.force
        else 0 }

    checkBasePosition = position =>
        position <= 1.5 && position >= 0

    updateBasePosition = (position, velocity) => {
        super.updateBasePosition (position, velocity)

        if (!this.backstroke && position > 1.4 ||
             this.backstroke && position < 0.1) {
            this.backstroke = !this.backstroke }

        this.piston.position.setY (position + 1.6) }}
