import * as Three from 'three'

import Physics from 'physics'
import Shapes from 'util/shapes'


export default class Entity {
    hasPhysicsBody = true

    constructor (properties = {}) {
        this.mesh = this.getMesh (properties)
        this.uuid = this.mesh.uuid
        if (this.hasPhysicsBody) {
            this.body = new Physics.Entity (this.uuid, properties) }}

    getMesh (properties) {
        return new Three.Mesh (this.getGeometry (properties), this.getMaterial (properties)) }

    getMaterial ({ color }) {
        return new Three.MeshLambertMaterial ({ color }) }

    getGeometry (properties) {
        if (properties.shape === Shapes.BOX)
            return new Three.BoxGeometry (properties.x, properties.y, properties.z)
        else if (properties.shape === Shapes.SPHERE)
            return new Three.SphereGeometry (properties.radius, 16, 12)
        else if (properties.shape === Shapes.CYLINDER)
            return new Three.CylinderGeometry (properties.radius, properties.radius, properties.height, 16) }


    spawn (world, x, y, z) {
        world.scene.add (this.mesh)
        world.entities[this.uuid] = this
        this.mesh.position.set (x, y, z)

        if (this.hasPhysicsBody) {
            world.physics.addEntity (this.body, x, y, z) }}
}
