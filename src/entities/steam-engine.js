import * as Three from 'three'

import M from 'util/math'
import Entity from 'entities'


export default class SteamEngine extends Entity {
    hasPhysicsBody = false
    backstroke = false
    pistonVelocity = 0

    getMesh () {
        const group = new Three.Group ()

        // Create the cylinder mesh
        const cylinder    = meshify (new Three.CylinderGeometry (.5, .5, 2, 16), 0xDDAA33)
        const cylinderRim = meshify (new Three.CylinderGeometry (.2, .2, .1, 16), 0xDDAA33)
        cylinder.position.setY (1.5)
        cylinderRim.position.setY (2.5)
        group.add (cylinder)
        group.add (cylinderRim)

        // Create the piston mesh
        this.piston = new Three.Group ()
        this.piston.position.setY (1.6)
        group.add (this.piston)

        const pistonRod = meshify (new Three.CylinderGeometry (.1, .1, 2, 16), 0xAAAAAA)
        const pistonHead = this.getPivot (0xAAAAAA, 0xFF2211)
        pistonHead.position.setY (1)
        this.piston.add (pistonRod)
        this.piston.add (pistonHead)

        // Create the beam stand mesh
        const beamStand = meshify (new Three.BoxGeometry (.2, 3, .2), 0xDDAA33)
        const beamPivot = this.getPivot (0xDDAA33, 0xAAAAAA)
        beamStand.position.set (3, 1.85, 0)
        beamPivot.position.set (3, 3.35, 0)
        group.add (beamStand)
        group.add (beamPivot)

        // Create the beam mesh
        this.beam = meshify (new Three.CylinderGeometry (.1, .1, 7, 16), 0xAAAAAA)
        this.beam.position.set (3, 3.7, 0)
        this.beam.rotation.z = Math.PI / 2
        group.add (this.beam)

        // Create the crankshaft
        this.crankshaft = new Three.Group ()
        this.crankshaft.position.set (6, 4.45, 0)
        group.add (this.crankshaft)

        const crankshaftRod = meshify (new Three.CylinderGeometry (.1, .1, 2, 16), 0xAAAAAA)
        const crankshaftHead = this.getPivot (0xAAAAAA, 0xFF2211)
        crankshaftRod.position.setY  (-1.35)
        crankshaftHead.position.setY (-.35)
        this.crankshaft.add (crankshaftRod)
        this.crankshaft.add (crankshaftHead)

        // Create the flywheel
        this.flywheel = new Three.Group ()
        this.flywheel.position.set (6, 1.5, 0)
        group.add (this.flywheel)

        const flywheelLeft  = meshify (new Three.CylinderGeometry (1, 1, .1, 32), 0xDDAA33)
        const flywheelRight = meshify (new Three.CylinderGeometry (1, 1, .1, 32), 0xDDAA33)
        const flywheelPin   = meshify (new Three.CylinderGeometry (.05, .05, .8, 16), 0xFF2211)

        flywheelLeft.position.setZ (-.25)
        flywheelRight.position.setZ (.25)
        flywheelLeft.rotation.x = Math.PI / 2
        flywheelRight.rotation.x = Math.PI / 2
        flywheelPin.position.setY (.75)
        flywheelPin.rotation.x = Math.PI / 2

        this.flywheel.add (flywheelLeft)
        this.flywheel.add (flywheelRight)
        this.flywheel.add (flywheelPin)

        return group }

    getPivot (pivotColor, pinColor) {
        const pivotGroup = new Three.Group ()

        const pivotBase  = meshify (new Three.BoxGeometry (.3, .1, .3), pivotColor)
        const pivotLeft  = meshify (new Three.BoxGeometry (.3, .5, .05), pivotColor)
        const pivotRight = meshify (new Three.BoxGeometry (.3, .5, .05), pivotColor)
        const pivotPin   = meshify (new Three.CylinderGeometry (.05, .05, .45, 16), pinColor)

        pivotLeft.position.set  (0, .3, -.125)
        pivotRight.position.set (0, .3, .125)
        pivotPin.position.setY  (.35)
        pivotPin.rotation.x = Math.PI / 2

        pivotGroup.add (pivotBase)
        pivotGroup.add (pivotLeft)
        pivotGroup.add (pivotRight)
        pivotGroup.add (pivotPin)

        return pivotGroup }

    spawn (world, x, y, z) {
        super.spawn (world, x, y, z)
        world.streams.timer.onValue (this.updatePistonPosition) }

    updatePistonPosition = () => {
        const position = this.piston.position
        this.pistonVelocity += 0.001

        position.setY (position.y + (this.backstroke ? -this.pistonVelocity : this.pistonVelocity))

        if (this.backstroke && position.y < 1.6 || !this.backstroke && position.y > 3.1) {
            position.setY (M.clamp (position.y, 1.60001, 3.09999))
            this.changePistonDirection () }

        const crankshaftRotation = this.getIntersectionAngle (2.2, .75, 4.55 - position.y)
        const flywheelRotation = this.getIntersectionAngle (.75, 2.2, 4.55 - position.y)
        this.beam.rotation.z = Math.PI / 2 - Math.asin((position.y - 2.35) / 3)
        this.crankshaft.position.setY (6.05 - position.y)
        this.crankshaft.rotation.z = crankshaftRotation * (this.backstroke ? -1 : 1)
        this.flywheel.rotation.z = flywheelRotation * (this.backstroke ? 1 : -1)
    }

    changePistonDirection = () => {
        this.backstroke = !this.backstroke
        this.pistonVelocity = 0 }

    getIntersectionAngle = (r1, r2, d) => {
        if (d > r1 + r2)
            throw new Error ("No solutions - circles are separate")
        else if (d < Math.abs (r1 - r2))
            throw new Error ("No solutions - one circle is inside the other")

        const a = (r1 * r1 - r2 * r2 + d * d) / (d * 2)
        return Math.acos (a / r1) }
}


// Helper functions
const meshify = (geometry, color) =>
    new Three.Mesh (geometry, new Three.MeshLambertMaterial ({ color }))
