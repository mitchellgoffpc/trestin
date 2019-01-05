import _ from 'lodash'
import * as Three from 'three'

import Chunk from 'chunk'


export default class World {
    chunks = {}

    constructor () {
        this.chunks['0,0,0'] = new Chunk(0, 0, 0)
        this.chunks['-1,0,-1'] = new Chunk(-1, 0, -1)
        this.ambientLight = new Three.AmbientLight (0x404040) }

    getScene = () => {
        let scene = new Three.Scene ()
        scene.background = new Three.Color (0xADCCFF)
        scene.add (this.ambientLight)
        _.forEach (this.chunks, chunk => chunk.populate (scene))
        return scene }
}
