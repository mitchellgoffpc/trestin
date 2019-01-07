import * as Three from 'three'

import Physics from 'physics'


export default class Block {
    constructor (color) {
        const geometry = new Three.BoxGeometry (1, 1, 1)
        const material = new Three.MeshLambertMaterial ({ color })
        this.mesh = new Three.Mesh (geometry, material)
        this.body = new Physics.Block (this.mesh.uuid)
        this.uuid = this.mesh.uuid }}
