// Helper function to resize the canvas size to the display size
export function resizeCanvasToDisplaySize(canvas, multiplier = 1) {
    var width  = canvas.clientWidth  * multiplier | 0
    var height = canvas.clientHeight * multiplier | 0
    if (canvas.width !== width ||  canvas.height !== height) {
        canvas.width  = width
        canvas.height = height
        return true
    } else {
        return false }}
