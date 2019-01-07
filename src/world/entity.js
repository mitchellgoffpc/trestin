import * as Three from 'three'

import Physics from 'physics'


export default class Entity {
    constructor (mass) {
        const geometry = new Three.SphereGeometry (0.5, 32, 32)
        const material = new Three.MeshLambertMaterial ({ color: 0xFFAA88 })
        this.mesh = new Three.Mesh (geometry, material)
        this.body = new Physics.Entity (this.mesh.uuid, mass)
        this.uuid = this.mesh.uuid }}
