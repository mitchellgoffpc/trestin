import _ from 'lodash'
import * as Three from 'three'

import Chunk from 'world/chunk'


export default class World {
    raycaster = new Three.Raycaster ()
    scene = new Three.Scene ()
    chunks = {
        '0,0,0':   new Chunk (0, 0, 0, 0x2244FF),
        '0,0,-1':  new Chunk (0, 0, -1, 0xDDAA33),
        '-1,0,0':  new Chunk (-1, 0, 0, 0x22BB33),
        '-1,0,-1': new Chunk (-1, 0, -1, 0xFF2211) }

    constructor () {
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.add (new Three.AmbientLight (0x404040))
        _.forEach (this.chunks, chunk => chunk.populate (this.scene)) }

    // Methods for creating and destroying objects

    createBlock = (x, y, z) => {
        const chunk = this.getChunkForPosition (x, y, z)
        if (chunk) {
            const coord = i => i >= 0 ? i % 16 : i % 16 + 16
            const block = chunk.createBlock (coord(x), coord(y), coord(z))
            console.log(coord(x), coord(y), coord(z))
            this.scene.add (block) }}

    destroyBlock = block => {
        const { x, y, z } = block.position
        const chunk = this.getChunkForPosition (x, y, z)
        if (chunk) {
            chunk.destroyBlock (block)
            this.scene.remove (block) }}

    // Helper methods

    getChunkForPosition = (x, y, z) => {
        const cx = Math.floor (x / 16)
        const cy = Math.floor (y / 16)
        const cz = Math.floor (z / 16)

        return this.chunks[`${cx},${cy},${cz}`] }

    getIntersections = (position, direction) => {
        this.raycaster.set (position, direction)
        return this.raycaster.intersectObjects (this.scene.children) }

    getClosestIntersection = (position, direction) =>
        _.chain  (this.getIntersections (position, direction))
         .sortBy ('distance')
         .first  ()
         .value  ()
}
