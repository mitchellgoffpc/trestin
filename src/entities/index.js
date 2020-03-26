import * as Three from 'three'

import Shapes from 'util/shapes'


export default class Entity {
    needsPhysicsBody = true
    needsGameTick = false

    constructor (properties = {}) {
        this.mesh = this.createMesh (properties)
        this.properties = properties }

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

    get uuid() {
        return this.mesh.uuid }}
