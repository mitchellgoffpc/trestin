import * as Three from 'three'

import Entity from 'entities'


export default class SteamEngine extends Entity {
    hasPhysicsBody = false
    backstroke = false
    pistonVelocity = 0

    getMesh () {
        const meshify = (geometry, color) => new Three.Mesh (geometry, new Three.MeshLambertMaterial ({ color }))
        this.pistonGroup = new Three.Group ()
        this.group = new Three.Group ()
        this.group.add (this.pistonGroup)

        const cylinder    = meshify (new Three.CylinderGeometry (0.5, 0.5, 2, 16), 0xDDAA33)
        const cylinderRim = meshify (new Three.CylinderGeometry (0.2, 0.2, 0.1, 16), 0xDDAA33)
        cylinderRim.position.setY (1)
        this.group.add (cylinder)
        this.group.add (cylinderRim)

        const pistonRod = meshify (new Three.CylinderGeometry (0.1, 0.1, 2, 16), 0xAAAAAA)
        const pistonHead = meshify (new Three.CylinderGeometry (0.4, 0.4, 0.1, 16), 0xAAAAAA)
        pistonHead.position.setY (1)
        this.pistonGroup.add (pistonRod)
        this.pistonGroup.add (pistonHead)

        return this.group }

    spawn (world, x, y, z) {
        super.spawn (world, x, y, z)
        world.streams.timer.onValue (this.updatePistonPosition) }

    updatePistonPosition = () => {
        const position = this.pistonGroup.position
        this.pistonVelocity += 0.001

        if (this.backstroke) {
            position.setY (position.y - this.pistonVelocity)
            if (position.y < 0.1) { this.changePistonDirection() }}
        else {
            position.setY (position.y + this.pistonVelocity)
            if (position.y > 1.5) { this.changePistonDirection() }}}

    changePistonDirection = () => {
        this.backstroke = !this.backstroke
        this.pistonVelocity = 0 }
}
