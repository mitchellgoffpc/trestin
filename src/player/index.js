import _ from 'lodash'
import Bacon from 'baconjs'
import * as Three from 'three'

import M from 'util/math'

// Constants
const UP = new Three.Vector3 (0, 1, 0)
const DOWN = new Three.Vector3 (0, -1, 0)
const SQUARE = new Three.Vector3 (1, 0, 1)

const truthy = Boolean
const handlers = {
    16: () => DOWN,
    32: () => UP,
    65: forward => forward.cross (DOWN),
    68: forward => forward.cross (UP),
    83: forward => forward.negate (),
    87: forward => forward }


// Player class
export default class Player {
    constructor (streams) {
        let aspectRatio = window.innerWidth / window.innerHeight
        this.camera = new Three.PerspectiveCamera (45, aspectRatio, 0.1, 1000)

        this.createEventStreams (streams)
        this.initializeEventHandlers () }

    // Create the event streams for this player
    createEventStreams = streams => {
        this.streams = { ...streams }
        this.streams.rotation = this.createRotationStream (this.streams)
        this.streams.movement = this.createMovementStream (this.streams) }

    createRotationStream = streams => {
        let initialRotation = new Three.Vector2 (0, 0)
        let yLimit = Math.PI / 2 - 0.0001

        return streams.mouseMove
            .filter (streams.controlsEnabled)
            .scan   (initialRotation, (rotation, e) => {
                let dx = rotation.x - e.movementX / 500
                let dy = rotation.y + e.movementY / 500
                let rx = dx % (Math.PI * 2)
                let ry = M.clamp (dy, -yLimit, yLimit)
                return new Three.Vector2 (rx, ry) }) }

    createMovementStream = streams => {
        let movementStreams = _.map(handlers, (value, key) => {
            let keyCode = parseInt(key)
            let down = streams.keyDown.filter (e => e.which === keyCode)
            let up   = streams.keyUp.filter (e => e.which === keyCode)

            return down.awaiting  (up)
                       .filter    (streams.controlsEnabled)
                       .sampledBy (streams.timer)
                       .filter    (truthy)
                       .map       (streams.rotation)
                       .map       (this.getMovementVector(keyCode)) })

        let initialPosition = new Three.Vector3 (0, 0, 5)
        let getNewPosition = (position, movement) => position.addScaledVector (movement, 0.1)

        return Bacon.mergeAll (movementStreams)
                    .scan     (initialPosition, getNewPosition) }

    // Set up event handlers for the appropriate streams
    initializeEventHandlers = () => {
        this.streams.resize.onValue (this.handleResizeCamera)
        this.streams.rotation.onValue (this.handleRotateCamera)
        this.streams.movement.onValue (this.handleMoveCamera) }

    handleResizeCamera = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix () }

    handleRotateCamera = gaze => {
        this.camera.lookAt (M.getDirectionVector(gaze).add(this.camera.position)) }

    handleMoveCamera = position => {
        this.camera.position.x = position.x
        this.camera.position.y = position.y
        this.camera.position.z = position.z }

    // Helper functions
    getMovementVector = keyCode => rotation =>
        handlers[keyCode] (M.getDirectionVector (rotation)
                            .multiply (SQUARE)
                            .normalize ())
}
