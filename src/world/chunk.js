import * as Three from 'three'

import Block from 'world/block'
import Physics from 'physics'


export default class Chunk {
    blocks = {}
    lights = {}

    constructor (x, y, z, color) {
        this.position = [x, y, z]
        this.color = color

        // Create the floor
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                this.createBlock (x, 0, z, 0x222222) }}

        // Create the outlines
        this.createBlock (0, 1, 0)
        this.createBlock (2, 1, 0)
        this.createBlock (0, 1, 2)

        this.createBlock (0, 1, 15)
        this.createBlock (2, 1, 15)
        this.createBlock (0, 1, 13)

        this.createBlock (15, 1, 0)
        this.createBlock (13, 1, 0)
        this.createBlock (15, 1, 2)

        this.createBlock (15, 1, 15)
        this.createBlock (13, 1, 15)
        this.createBlock (15, 1, 13)

        // Add a light in the center
        this.createLight (8, 15, 8, 0.7) }

    // Populate the scene and physics engine
    populate = (scene, physics) => {
        _.forEach (this.blocks, block => scene.add (block.mesh))
        _.forEach (this.lights, light => scene.add (light))
        _.forEach (this.blocks, block => {
            const { x, y, z } = block.mesh.position
            physics.addBlock (block.body, x, y, z) }) }


    // Methods for creating and destroying objects

    createBlock = (x, y, z, color = this.color) => {
        const [cx, cy, cz] = this.position
        const block = new Block (color)
        block.mesh.position.set (cx * 16 + x, cy * 16 + y, cz * 16 + z)
        this.blocks[block.uuid] = block
        return block }

    createLight = (x, y, z, intensity = 1.0) => {
        const [cx, cy, cz] = this.position
        const light = new Three.PointLight (0xFFFFFF, intensity)
        light.position.set (cx * 16 + x, cy * 16 + y, cz * 16 + z)
        this.lights[light.uuid] = light
        return light }

    destroyBlock = uuid => {
        const block = this.blocks[uuid]
        delete this.blocks[uuid]
        return block }
}
