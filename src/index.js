import * as Three from 'three'
import map from 'lodash-es/map'

import Player from 'player'
import World from 'world'
import Directions from 'util/directions'


// Constants

const UP = new Three.Vector3 (0, 1, 0)
const DOWN = new Three.Vector3 (0, -1, 0)
const ZERO = new Three.Vector3 (0, 0, 0)

const KEY_DIRECTIONS = {
    16: Directions.DOWN.vector,
    32: Directions.UP.vector,
    65: Directions.EAST.vector,
    68: Directions.WEST.vector,
    83: Directions.NORTH.vector,
    87: Directions.SOUTH.vector }


// Helper functions

const getMovementVector = activeKeys =>
    Array.from (activeKeys) .reduce ((total, keyCode) => total.add (KEY_DIRECTIONS[keyCode]), ZERO.clone ())


// Application entry point

window.addEventListener("load", () => {
    let world = new World ()
    let player = new Player (world)
    let renderer = new Three.WebGLRenderer ({ antialias: true })

    let activeKeys = new Set ()
    let controlsAreEnabled = false
    let lastRenderTimestamp = null
    let drawCount = 0, totalTime = 0

    // A little housekeeping

    player.handleResizeCamera (window.innerWidth, window.innerHeight)
    renderer.setSize (window.innerWidth, window.innerHeight)
    document.body.appendChild (renderer.domElement)

    // Attach the event handlers

    window.addEventListener ("resize", () => {
        renderer.setSize (window.innerWidth, window.innerHeight)
        player.handleResizeCamera (window.innerWidth, window.innerHeight) })

    document.addEventListener ("pointerlockchange", () => {
        controlsAreEnabled = document.pointerLockElement === document.body
        if (!controlsAreEnabled) { activeKeys.clear () }})

    document.addEventListener ("mousedown", event => {
        if (!controlsAreEnabled) document.body.requestPointerLock ()
        else if (event.which === 1) player.handlePlaceBlock ()
        else if (event.which === 3) player.handleDestroyBlock () })

    document.addEventListener ("mousemove", event => {
        if (controlsAreEnabled) { player.handleUpdateRotation (event.movementX, event.movementY) }})
    document.addEventListener ("keydown", event => {
        if (controlsAreEnabled && event.which in KEY_DIRECTIONS) { activeKeys.add (event.which) }})
    document.addEventListener ("keyup", event => {
        if (controlsAreEnabled && event.which in KEY_DIRECTIONS) { activeKeys.delete (event.which) }})

    // Render loop

    function draw (timestamp) {
        requestAnimationFrame (draw)
        const dt = lastRenderTimestamp ? timestamp - lastRenderTimestamp : 16
        lastRenderTimestamp = timestamp
        totalTime += dt
        drawCount += 1

        world.step (dt)
        player.step (dt, getMovementVector (activeKeys))
        renderer.render (world.scene, player.camera)

        if (totalTime > 1000) {
            const fps = drawCount / totalTime * 1000
            totalTime = 0, drawCount = 0
            document.querySelector ("#frame-rate") .innerHTML = `${fps.toFixed(2)}fps` }}

    draw () })
