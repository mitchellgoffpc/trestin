import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import LinearConnection from 'physics/machinery/connections/linear'
import GeometryBuilder from 'util/geometry'


export default class Counterweight extends Machine {
    connections = {
        beam: new LinearConnection (this, {
            input: x => -Math.atan ((x - .75) / 3),
            output: x => -Math.tan (x) * 3 - .75 }) }

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

    getBaseForce = () => 0.0001

    checkBasePosition = position =>
        Math.abs (position) <= Math.PI / 4

    updateBasePosition = (position, velocity) => {
        super.updateBasePosition (position, velocity)
        this.beam.rotation.z = position
        this.weight.position.set (Math.cos (position) * 3, Math.sin (position) * 3 + 3.7, 0) }}
