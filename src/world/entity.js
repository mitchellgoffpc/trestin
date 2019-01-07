import * as Three from 'three'

import Physics from 'physics'
import Shapes from 'util/shapes'


export default class Entity {
    constructor ({ color, ...properties }) {
        const geometry = this.getGeometry (properties)
        const material = new Three.MeshLambertMaterial ({ color })
        this.mesh = new Three.Mesh (geometry, material)
        this.body = new Physics.Entity (this.mesh.uuid, properties)
        this.uuid = this.mesh.uuid }

    getGeometry = properties => do {
        if (properties.shape === Shapes.BOX)
            new Three.BoxGeometry (properties.x, properties.y, properties.z)
        else if (properties.shape === Shapes.SPHERE)
            new Three.SphereGeometry (properties.radius, 16, 12)
        else if (properties.shape === Shapes.CYLINDER)
            new Three.CylinderGeometry (properties.radius, properties.radius, properties.height, 16) }}
