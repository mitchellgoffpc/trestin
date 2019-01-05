import * as Three from 'three'

import Player from 'player'
import World from 'world'
import { initializeEventStreams } from 'util/streams'


// Application entry point
window.onload = () => {
    let renderer = new Three.WebGLRenderer ({ antialias: true })

    let streams = initializeEventStreams ()
    let player = new Player (streams)
    let world = new World ()

    // A little housekeeping
    renderer.setSize (window.innerWidth, window.innerHeight)
    document.body.appendChild (renderer.domElement)

    // Render loop
    function draw () {
        requestAnimationFrame (draw)
        renderer.render (world.getScene (), player.camera) }

    draw ()

    // A few event handlers
    streams.mouseDown.onValue (() => document.body.requestPointerLock())
    streams.resize.onValue (() =>
        renderer.setSize(window.innerWidth, window.innerHeight)) }
