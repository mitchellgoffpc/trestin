const fragment = `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

void main() {
  // Just set the output to a constant redish-purple
  gl_FragColor = vec4(1, 0, 0.5, 1);
}`

export default fragment
