import fragmentSource from 'shaders/fragment'
import vertexSource from 'shaders/vertex'

import { createShader, createProgram } from 'util/shaders'
import { resizeCanvasToDisplaySize } from 'util/canvas'


function main() {
    const canvas = document.querySelector("#root-canvas")
    const gl = canvas.getContext("webgl")

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.")
        return }

    // Resize the canvas
    resizeCanvasToDisplaySize(gl.canvas)
    window.onresize = () => resizeCanvasToDisplaySize(gl.canvas)

    // Compile the shaders
    var vertexShader = createShader (gl, gl.VERTEX_SHADER, vertexSource)
    var fragmentShader = createShader (gl, gl.FRAGMENT_SHADER, fragmentSource)
    var program = createProgram (gl, vertexShader, fragmentShader)
    gl.useProgram (program)

    var positionAttributeLocation = gl.getAttribLocation (program, "a_position")
    var resolutionUniformLocation = gl.getUniformLocation (program, "u_resolution")

    // three 2d points
    var positionBuffer = gl.createBuffer ()
    var positions = new Float32Array([
        10,  20,
        280, 20,
        10,  130,
        10,  130,
        280, 20,
        280, 130 ])

    gl.bindBuffer (gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData (gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // Set the resolution
    gl.uniform2f (resolutionUniformLocation, gl.canvas.width, gl.canvas.height)

    // Clear the screen
    gl.clearColor (0.9, 0.85, 0.8, 1.0)
    gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.viewport (0, 0, gl.canvas.width, gl.canvas.height)

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer

    gl.enableVertexAttribArray (positionAttributeLocation)
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

    gl.drawArrays (gl.TRIANGLES, 0, 6)
}


// Set up the entry point
window.onload = main
