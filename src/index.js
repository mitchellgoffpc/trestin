import * as Three from 'three'

import Player from 'player'
// import World from 'world'
// import M from 'util/math'
// import { geometry, colors } from 'models/block'
import { initializeEventStreams } from 'util/streams'


// Application entry point
function main () {
    let scene = new Three.Scene()
    let renderer = new Three.WebGLRenderer({ antialias: true })

    let streams = initializeEventStreams()
    let player = new Player(streams)

    // A little housekeeping
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // Create a cube
    let geometry = new Three.BoxGeometry(1, 1, 1)
    let material = new Three.MeshLambertMaterial({ color: 0xFF0000 })
    let cube = new Three.Mesh(geometry, material)
    scene.add(cube)

    // Create a point light
    const pointLight = new Three.PointLight(0xFFFFFF)
    pointLight.position.set(10, 50, 130)
    scene.add(pointLight)

    // Render loop
    function draw () {
        requestAnimationFrame(draw)

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        renderer.render(scene, player.camera) }

    draw()

    // A few event handlers
    streams.mouseDown.onValue(() => document.body.requestPointerLock())
    streams.resize.onValue(() => renderer.setSize(window.innerWidth, window.innerHeight)) }


// Set up the entry point
window.onload = main
