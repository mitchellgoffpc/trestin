import fragmentSource from 'shaders/fragment'
import vertexSource from 'shaders/vertex'
import { createShader, createProgram } from 'util/shaders'

export function initializeWebGL (gl) {
    if (!gl) {
        let message = "Unable to initialize WebGL. Your browser or machine may not support it."
        alert (message)
        throw Exception (message) }

    gl.enable (gl.CULL_FACE)
    gl.enable (gl.DEPTH_TEST)

    // Compile the shaders
    let vertexShader = createShader (gl, gl.VERTEX_SHADER, vertexSource)
    let fragmentShader = createShader (gl, gl.FRAGMENT_SHADER, fragmentSource)
    let program = createProgram (gl, vertexShader, fragmentShader)
    gl.useProgram (program)

    return createGLContext (gl, program) }


// Helper function to create a GL context object
function createGLContext (gl, program) {
    let buffers = {
        position: gl.createBuffer (),
        color:    gl.createBuffer () }

    let attributes = {
        position: gl.getAttribLocation (program, "a_position"),
        color:    gl.getAttribLocation(program, "a_color") }
    let uniforms = {
        transform: gl.getUniformLocation (program, "u_transform") }

    // Tell the attributes how to get data out of the buffers
    gl.bindBuffer (gl.ARRAY_BUFFER, buffers.position)
    gl.enableVertexAttribArray (attributes.position)
    gl.vertexAttribPointer (attributes.position, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer (gl.ARRAY_BUFFER, buffers.color)
    gl.enableVertexAttribArray (attributes.color)
    gl.vertexAttribPointer (attributes.color, 3, gl.UNSIGNED_BYTE, true, 0, 0)

    return { program, buffers, attributes, uniforms }}
