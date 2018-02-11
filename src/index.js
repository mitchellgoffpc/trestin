import fragmentSource from 'shaders/fragment'
import vertexSource from 'shaders/vertex'


function main() {
    const canvas = document.querySelector("#root-canvas")
    const gl = canvas.getContext("webgl")

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.")
        return }

    // Compile the shaders
    var vertexShader = createShader (gl, gl.VERTEX_SHADER, vertexSource)
    var fragmentShader = createShader (gl, gl.FRAGMENT_SHADER, fragmentSource)
    var program = createProgram (gl, vertexShader, fragmentShader)
    gl.useProgram (program)

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    var positionBuffer = gl.createBuffer()
    gl.bindBuffer (gl.ARRAY_BUFFER, positionBuffer)

    // three 2d points
    var positions = new Float32Array([
        0, 0,
        0, 0.5,
        0.7, 0 ])

    gl.bufferData (gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

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

    gl.drawArrays (gl.TRIANGLES, 0, 3)
}


// Helper functions to compile and link the shaders
function createShader(gl, type, source) {
    var shader = gl.createShader (type)
    gl.shaderSource (shader, source)
    gl.compileShader (shader)

    var success = gl.getShaderParameter (shader, gl.COMPILE_STATUS)
    if (success) {
        return shader
    } else {
        console.log(gl.getShaderInfoLog(shader))
        gl.deleteShader (shader) }}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram ()
    gl.attachShader (program, vertexShader)
    gl.attachShader (program, fragmentShader)
    gl.linkProgram (program)

    var success = gl.getProgramParameter (program, gl.LINK_STATUS)
    if (success) {
        return program
    } else {
        console.log(gl.getProgramInfoLog(program))
        gl.deleteProgram (program) }}


// Set up the entry point
window.onload = main
