import Bacon from 'baconjs'

// Initialize some global event streams
export function initializeEventStreams () {
    let pointerLockChange = Bacon.fromEvent(document, "pointerlockchange")
    let controlsEnabled = pointerLockChange.map(controlsAreEnabled).toProperty()

    let mouseDown = Bacon.fromEvent (document, "mousedown")
    let leftClickDown  = mouseDown.filter (e => e.which === 1)
    let rightClickDown = mouseDown.filter (e => e.which === 3)

    return { controlsEnabled, mouseDown,
             leftClickDown, rightClickDown,
             mouseMove: Bacon.fromEvent (document, "mousemove"),
             keyDown:   Bacon.fromEvent (document, "keydown"),
             keyUp:     Bacon.fromEvent (document, "keyup"),
             resize:    Bacon.fromEvent (window, "resize"),
             timer:     Bacon.interval (10, null) }}


// Helper functions
let controlsAreEnabled = () => document.pointerLockElement === document.body
