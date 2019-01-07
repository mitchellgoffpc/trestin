import * as Three from 'three'

import Player from 'player'
import World from 'world'
import { initializeEventStreams } from 'util/streams'


// Application entry point
window.onload = () => {
    let streams = initializeEventStreams ()

    let world = new World (streams)
    let player = new Player (streams, world)
    let renderer = new Three.WebGLRenderer ({ antialias: true })

    // A little housekeeping
    renderer.setSize (window.innerWidth, window.innerHeight)
    document.body.appendChild (renderer.domElement)

    // Render loop
    function draw () {
        requestAnimationFrame (draw)
        renderer.render (world.scene, player.camera) }

    draw ()

    // A few event handlers
    streams.mouseDown.onValue (() => document.body.requestPointerLock ())
    streams.resize.onValue (() =>
        renderer.setSize (window.innerWidth, window.innerHeight)) }
