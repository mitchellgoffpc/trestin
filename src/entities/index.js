import * as Three from 'three'

import Physics from 'physics'
import Shapes from 'util/shapes'


export default class Entity {
    needsPhysicsBody = true
    needsGameTick = false

    constructor (properties = {}) {
        this.mesh = this.createMesh (properties)
        this.uuid = this.mesh.uuid
        if (this.needsPhysicsBody) {
            this.body = new Physics.Entity (this.uuid, properties) }}

    createMesh (properties) {
        return new Three.Mesh (this.createGeometry (properties), this.createMaterial (properties)) }

    createMaterial ({ color }) {
        return new Three.MeshLambertMaterial ({ color }) }

    createGeometry (properties) {
        if (properties.shape === Shapes.BOX)
            return new Three.BoxGeometry (properties.x, properties.y, properties.z)
        else if (properties.shape === Shapes.SPHERE)
            return new Three.SphereGeometry (properties.radius, 16, 12)
        else if (properties.shape === Shapes.CYLINDER)
            return new Three.CylinderGeometry (properties.radius, properties.radius, properties.height, 16) }

    tick () {}
    spawn (world, x, y, z) {
        world.scene.add (this.mesh)
        world.entities[this.uuid] = this
        this.mesh.position.set (x, y, z)

        if (this.needsPhysicsBody) {
            world.physics.addEntity (this.body, x, y, z) }
        if (this.needsGameTick) {
            world.streams.timer.onValue (() => this.tick()) }}
}
