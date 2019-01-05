import _ from 'lodash'
import * as Three from 'three'


export default class Chunk {
    blocks = []
    lights = []

    constructor (x, y, z) {
        this.position = [x, y, z]

        this.createBlock (0, 0, 0)
        this.createBlock (2, 0, 0)
        this.createBlock (0, 0, 2)

        this.createBlock (0, 0, 15)
        this.createBlock (2, 0, 15)
        this.createBlock (0, 0, 13)

        this.createBlock (15, 0, 0)
        this.createBlock (13, 0, 0)
        this.createBlock (15, 0, 2)

        this.createBlock (15, 0, 15)
        this.createBlock (13, 0, 15)
        this.createBlock (15, 0, 13)

        this.createLight (8, 15, 8, 0.7) }

    // Helper methods
    createBlock = (x, y, z) => {
        const [cx, cy, cz] = this.position
        const geometry = new Three.BoxGeometry (1, 1, 1)
        const material = new Three.MeshLambertMaterial ({ color: 0xFF0000 })
        const mesh = new Three.Mesh (geometry, material)
        mesh.position.set (cx * 16 + x, cy * 16 + y, cz * 16 + z)
        this.blocks.push (mesh) }

    createLight = (x, y, z, intensity) => {
        const [cx, cy, cz] = this.position
        const light = new Three.PointLight (0xFFFFFF * intensity)
        light.position.set (cx * 16 + x, cy * 16 + y, cz * 16 + z)
        this.lights.push (light) }

    // Populate the scene
    populate = scene => {
        _.forEach (this.blocks, block => scene.add (block))
        _.forEach (this.lights, light => scene.add (light)) }
}
