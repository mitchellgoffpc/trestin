export default `
attribute vec4 a_position;
attribute vec4 a_color;

uniform mat4 u_transform;

varying vec4 v_color;

void main() {
    // Multiply the position by the transform matrix.
    gl_Position = u_transform * a_position;

    // Pass the color to the fragment shader.
    v_color = a_color;
}`
