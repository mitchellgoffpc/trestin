import * as Three from 'three'

import Machine from 'blocks/machines'
import Pivot from 'blocks/geometry/pivot'
import LinearConnection from 'physics/machinery/connections/linear'
import GeometryBuilder from 'util/geometry'


export default class Crank extends Machine {
    crankshaftHigh = false
    connections = {
        crankshaft: new LinearConnection (this, {
            accelerationInverted: () => this.crankshaftHigh,
            input: x => {
                const nudge = x < .75 ? .00001 : -.00001
                const reverse = this.crankshaftHigh ? 1 : -1
                return this.getIntersectionAngle (.75, 2.2, 1.45 + x + nudge) * reverse },
            output: x => {
                const crankshaftAngle = Math.asin (Math.sin (x) * .75 / 2.2)
                return Math.cos (crankshaftAngle) * 2.2 + Math.cos (x) * .75 }}) }

    createMesh () {
        const builder = new GeometryBuilder ()
        const crankshaft = builder.addSubgroup ({ y: 4.45 })
        const flywheel = builder.addSubgroup ({ y: 1.5 })
        this.crankshaft = crankshaft.getMesh ()
        this.flywheel = flywheel.getMesh ()

        builder.addBox ({ dx: .5, dy: 2.25, dz: .1, y: .6, z: .45, color: 0xDDAA33 })
        builder.addBox ({ dx: .5, dy: 2.25, dz: .1, y: .6, z: -.45, color: 0xDDAA33 })
        builder.addCylinder ({ r: .05, h: .2, y: 1.5, z: .35, rx: Math.PI / 2, color: 0xFF2211 })
        builder.addCylinder ({ r: .05, h: .2, y: 1.5, z: -.35, rx: Math.PI / 2, color: 0xFF2211 })
        flywheel.addCylinder ({ r: 1, h: .1, z: .25, rx: Math.PI / 2, faces: 32, color: 0xDDAA33 })
        flywheel.addCylinder ({ r: 1, h: .1, z: -.25, rx: Math.PI / 2, faces: 32, color: 0xDDAA33 })
        flywheel.addCylinder ({ r: .05, h: .8, y: .75, rx: Math.PI / 2, color: 0xFF2211 })
        crankshaft.addCylinder ({ r: .1, h: 2, y: -1.35, color: 0xAAAAAA })
        crankshaft.addMesh ({ y: -.35, mesh: Pivot.createMesh (0xAAAAAA, 0xFF2211) })

        return builder.getMesh () }

    getBaseForce = (position, velocity) => {
        // const crankshaft = this.connections.crankshaft
        // const positionFromJoint = crankshaft.input (crankshaft.joint.position + crankshaft.joint.velocity)
        // const velocityFromJoint = positionFromJoint - crankshaft.input (crankshaft.joint.position)
        return 0 }

    updateBasePosition = (position, velocity) => {
        if (Math.sign (this.baseVelocity) !== Math.sign (velocity)) {
            console.log (this.connections.crankshaft.joint.position, this.basePosition, this.baseVelocity)

            // (Math.abs (this.basePosition) < Math.PI &&
            //  Math.abs (this.basePosition + this.baseVelocity * 2) >= Math.PI ||
            //  Math.sign (this.basePosition) !== Math.sign (this.basePosition + this.baseVelocity * 2))) {
            // this.crankshaftHigh = !this.crankshaftHigh }
            // position = this.basePosition + this.baseVelocity
            // velocity = this.baseVelocity }
        }

        super.updateBasePosition (position, velocity)

        this.flywheel.rotation.z = position
        this.crankshaft.rotation.z = -Math.asin (Math.sin (position) * .75 / 2.2)
        this.crankshaft.position.setY (2.95 + this.connections.crankshaft.joint.position)
    }

    getIntersectionAngle = (r1, r2, d) => {
        if (d > r1 + r2)
            throw new Error ("No solutions - circles are separate")
        else if (d < Math.abs (r1 - r2))
            throw new Error ("No solutions - one circle is inside the other")

        const a = (r1 * r1 - r2 * r2 + d * d) / (d * 2)
        return Math.acos (a / r1) }}
