import { vec3 as v3, mat4 as m4 } from 'gl-matrix'

import Player from 'player'
import World from 'world'
import M from 'util/math'
import { geometry, colors } from 'models/block'
import { initializeWebGL } from 'util/webgl'
import { initializeEventStreams } from 'util/streams'
import { resizeCanvasToDisplaySize } from 'util/canvas'


// Application entry point
function main () {
    let canvas = document.querySelector("#root-canvas")
    let gl = canvas.getContext("webgl")
    let ctx = initializeWebGL (gl)
    let streams = initializeEventStreams (canvas)
    let player = new Player (streams)
    let world = new World ()

    // Load buffer data
    gl.bindBuffer (gl.ARRAY_BUFFER, ctx.buffers.position)
    gl.bufferData (gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW)
    gl.bindBuffer (gl.ARRAY_BUFFER, ctx.buffers.color)
    gl.bufferData (gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)

    // Set up the event loop
    streams.timer.onValue(() => draw (gl, ctx, player)) }


// Draw function
function draw (gl, ctx, player) {
    // Resize the canvas and set the resolution uniform
    resizeCanvasToDisplaySize (gl.canvas)

    // Clear the screen
    gl.clearColor (0.9, 0.85, 0.8, 1.0)
    gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport (0, 0, gl.canvas.width, gl.canvas.height)

    // Compute the transform matrix
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    let target = v3.create ()
    let matrix = m4.create (),
        view   = m4.create ()
    let direction = M.getDirectionVector (player.rotation)

    v3.add (target, player.position, direction.value ())
    m4.lookAt (view, player.position, target, v3.fromValues (0, -1, 0))
    m4.perspective (matrix, 100, aspect, 1, 2000)
    m4.multiply (matrix, matrix, view)

    // Set the transform uniform
    gl.uniformMatrix4fv (ctx.uniforms.transform, false, matrix)

    // Render
    gl.drawArrays (gl.TRIANGLES, 0, 6 * 6) }



// Set up the entry point
window.onload = main
