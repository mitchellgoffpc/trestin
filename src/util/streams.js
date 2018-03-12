import Bacon from 'baconjs'

// Initialize some global event streams
export function initializeEventStreams (canvas) {
    canvas.onclick = () => canvas.requestPointerLock()

    let mouseMove = Bacon.fromEvent (document, "mousemove")
    let gazeMove = mouseMove.filter (e =>
        document.pointerLockElement === canvas)

    return {
        mouseMove, gazeMove,
        keyDown:   Bacon.fromEvent (document, "keydown"),
        keyUp:     Bacon.fromEvent (document, "keyup"),
        timer:     Bacon.interval (15, null) }}
