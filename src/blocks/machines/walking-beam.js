import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import LinearConnection from 'physics/machinery/connections/linear'
import GeometryBuilder from 'util/geometry'
import M from 'util/math'


export default class WalkingBeam extends Machine {
    connections = {
        left:  new LinearConnection (this, {
            accelerationInverted: true,
            input: x => -Math.atan ((x - .75) / 3),
            output: x => Math.tan (-x) * 3 + .75 }),

        right: new LinearConnection (this, {
            input: x => Math.atan ((x - .75) / 3),
            output: x => Math.tan (x) * 3 + .75 }) }

    createMesh () {
        const builder = new GeometryBuilder ()
        const beam = builder.addSubgroup ({ y: 3.7 })
        this.beam = beam.getMesh ()

        builder.addBox ({ dx: .2, dy: 3, dz: .2, y: 1.85, color: 0xDDAA33 })
        builder.addMesh ({ y: 3.35, mesh: Pivot.createMesh (0xDDAA33, 0xAAAAAA) })
        beam.addCylinder ({ r: .1, h: 7, rz: Math.PI / 2, color: 0xAAAAAA })

        return builder.getMesh () }

    checkBasePosition = position =>
        Math.abs (position) <= Math.PI / 4

    updateBasePosition = (position, velocity) => {
        super.updateBasePosition (position, velocity)
        this.beam.rotation.z = position }}
