import Bacon from 'baconjs'
import { vec2 as v2,
         vec3 as v3,
         mat4 as m4 } from 'gl-matrix'

import fragmentSource from 'shaders/fragment'
import vertexSource from 'shaders/vertex'
import M from 'util/math'

import { colors, geometry } from 'models/block'
import { createShader, createProgram } from 'util/shaders'
import { resizeCanvasToDisplaySize } from 'util/canvas'


function main () {
    const canvas = document.querySelector("#root-canvas")
    const gl = canvas.getContext("webgl")

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.")
        return }

    gl.enable (gl.CULL_FACE)
    gl.enable (gl.DEPTH_TEST)

    // Compile the shaders
    let vertexShader = createShader (gl, gl.VERTEX_SHADER, vertexSource)
    let fragmentShader = createShader (gl, gl.FRAGMENT_SHADER, fragmentSource)
    let program = createProgram (gl, vertexShader, fragmentShader)
    gl.useProgram (program)

    // Create buffers for geometry and color and put some data into them
    let positionBuffer = gl.createBuffer ()
    let colorBuffer = gl.createBuffer ()

    gl.bindBuffer (gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData (gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)
    gl.bindBuffer (gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData (gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)

    // Get attribute and uniform locations
    let attributes = {
        position: gl.getAttribLocation (program, "a_position"),
        color:    gl.getAttribLocation(program, "a_color") }

    let uniforms = {
        transform: gl.getUniformLocation (program, "u_transform") }

    // Tell the attributes how to get data out of the buffers
    gl.bindBuffer (gl.ARRAY_BUFFER, positionBuffer)
    gl.enableVertexAttribArray (attributes.position)
    gl.vertexAttribPointer (attributes.position, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer (gl.ARRAY_BUFFER, colorBuffer)
    gl.enableVertexAttribArray (attributes.color)
    gl.vertexAttribPointer (attributes.color, 3, gl.UNSIGNED_BYTE, true, 0, 0)

    // Event handlers
    let position = v3.fromValues(0, 0, -20),
        rotation = v2.fromValues(0, 0)

    let keyDown   = Bacon.fromEvent(document, "keydown"),
        keyUp     = Bacon.fromEvent(document, "keyup"),
        mouseMove = Bacon.fromEvent(document, "mousemove"),
        timer     = Bacon.interval(15, null)

    let move = direction => v3.add(position, position, direction.scale(0.2).value())
    let handlers = {
        16: () => move (M.fromValues (0, +1, 0)),
        32: () => move (M.fromValues (0, -1, 0)),
        65: forward => move (forward.cross (v3.fromValues (0, -1, 0))),
        68: forward => move (forward.cross (v3.fromValues (0, +1, 0))),
        83: forward => move (forward.negate ()),
        87: forward => move (forward) }

    for (var key in handlers) {
        let keyCode = parseInt(key)
        let down = keyDown.filter(e => e.which == keyCode)
        let up = keyUp.filter(e => e.which == keyCode)
        let holding = down.awaiting(up)
        let moving = holding.sampledBy(timer).filter(x => x)

        moving.onValue(e => {
            let forward = getDirection(rotation)
                .multiply (v3.fromValues (1, 0, 1))
                .normalize ()

            handlers[keyCode](forward) })}

    // Initialize pointer lock
    canvas.onclick = () => canvas.requestPointerLock()
    mouseMove.filter(e => document.pointerLockElement === canvas)
             .onValue(e => {
                let yLimit = Math.PI / 2 - 0.0001
                let dx = rotation[0] + e.movementX / 500,
                    dy = rotation[1] + e.movementY / 500
                let rx = dx % (Math.PI * 2),
                    ry = M.clamp(dy, -yLimit, yLimit)
                 v2.set(rotation, rx, ry) })

    // Draw function
    function draw () {
        // Resize the canvas and set the resolution uniform
        resizeCanvasToDisplaySize (gl.canvas)
        gl.uniform2f (uniforms.resolution, gl.canvas.width, gl.canvas.height)

        // Clear the screen
        gl.clearColor (0.9, 0.85, 0.8, 1.0)
        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.viewport (0, 0, gl.canvas.width, gl.canvas.height)

        // Compute the transform matrix
        let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
        let target = v3.create ()
        let matrix = m4.create (),
            view   = m4.create ()
        let direction = getDirection(rotation).value()

        v3.add (target, position, direction)
        m4.lookAt (view, position, target, v3.fromValues(0, -1, 0))
        m4.perspective (matrix, 100, aspect, 1, 2000)
        m4.multiply (matrix, matrix, view)

        // Set the transform uniform
        gl.uniformMatrix4fv (uniforms.transform, false, matrix)

        // Draw the rectangle
        gl.drawArrays (gl.TRIANGLES, 0, 6 * 6)
    }

    // Set up the event loop
    timer.onValue(draw)
}

// Helper functions
let getDirection = rotation =>
    M.fromValues (-Math.sin(rotation[0]) * Math.cos(rotation[1]),
                  -Math.sin(rotation[1]),
                   Math.cos(rotation[0]) * Math.cos(rotation[1]))


// Set up the entry point
window.onload = main
