import * as Three from 'three'

import Physics from 'physics'


export default class Block {
    constructor (color) {
        this.mesh = this.createMesh (color)
        this.body = new Physics.Block (this.mesh.uuid)
        this.uuid = this.mesh.uuid }

    createMesh (color) {
        return new Three.Mesh (this.createGeometry (), this.createMaterial (color)) }

    createGeometry () {
        return new Three.BoxGeometry (1, 1, 1) }

    createMaterial (color) {
        return new Three.MeshLambertMaterial ({ color }) }}
