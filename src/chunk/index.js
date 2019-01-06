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

    // Populate the scene
    populate = scene => {
        this.blocks.forEach (block => scene.add (block))
        this.lights.forEach (light => scene.add (light)) }

    // Helper methods
    createBlock = (x, y, z) => {
        const [cx, cy, cz] = this.position
        const geometry = new Three.BoxGeometry (1, 1, 1)
        const material = new Three.MeshLambertMaterial ({ color: 0xFF0000 })
        const block = new Three.Mesh (geometry, material)
        block.position.set (cx * 16 + x, cy * 16 + y, cz * 16 + z)
        this.blocks.push (block)
        return block }

    createLight = (x, y, z, intensity) => {
        const [cx, cy, cz] = this.position
        const light = new Three.PointLight (0xFFFFFF * intensity)
        light.position.set (cx * 16 + x, cy * 16 + y, cz * 16 + z)
        this.lights.push (light)
        return light }

    destroyBlock = block => {
        this.blocks = this.blocks.filter (x => x !== block) }
}
