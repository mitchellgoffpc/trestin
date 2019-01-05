import Bacon from 'baconjs'

// Initialize some global event streams
export function initializeEventStreams () {
    let pointerLockChange = Bacon.fromEvent(document, "pointerlockchange")
    let controlsEnabled = pointerLockChange.map(controlsAreEnabled).toProperty()

    return { controlsEnabled,
             mouseMove: Bacon.fromEvent (document, "mousemove"),
             mouseDown: Bacon.fromEvent (document, "mousedown"),
             keyDown:   Bacon.fromEvent (document, "keydown"),
             keyUp:     Bacon.fromEvent (document, "keyup"),
             resize:    Bacon.fromEvent (window, "resize"),
             timer:     Bacon.interval (10, null) }}


// Helper functions
let controlsAreEnabled = () => document.pointerLockElement === document.body
