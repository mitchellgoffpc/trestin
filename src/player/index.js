import _ from 'lodash'
import Bacon from 'baconjs'
import * as Three from 'three'

import M from 'util/math'

// Constants
const UP = new Three.Vector3 (0, 1, 0)
const DOWN = new Three.Vector3 (0, -1, 0)
const SQUARE = new Three.Vector3 (1, 0, 1)

const truthy = Boolean
const yLimit = Math.PI / 2 - 0.0001
const initialRotation = new Three.Vector2 (0, 0)
const initialPosition = new Three.Vector3 (0, 0, 5)

const handlers = {
    16: () => DOWN,
    32: () => UP,
    65: forward => forward.cross (DOWN),
    68: forward => forward.cross (UP),
    83: forward => forward.negate (),
    87: forward => forward }


// Player class
export default class Player {
    camera = new Three.PerspectiveCamera (45, 1, 0.1, 1000)

    constructor (streams, world) {
        this.handleResizeCamera ()
        this.createEventStreams (streams)
        this.world = world

        this.streams.resize.onValue (this.handleResizeCamera)
        this.streams.movement.onValue (this.handleMoveCamera)
        this.streams.rotation.onValue (this.handleRotateCamera)
        this.streams.crosshair.onValue (this.handleHighlightCrosshairs) }

    // Create the event streams for this player

    createEventStreams = streams => {
        this.streams = { ...streams }
        this.streams.rotation = this.createRotationStream (this.streams)
        this.streams.movement = this.createMovementStream (this.streams)
        this.streams.crosshair = this.createCrosshairStream (this.streams) }

    createRotationStream = streams =>
        streams.mouseMove.filter (streams.controlsEnabled)
                         .scan   (initialRotation, this.getNewRotation)
                         .map    (M.getDirectionVector)

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

        return Bacon.mergeAll (movementStreams)
                    .scan     (initialPosition, this.getNewPosition) }

    createCrosshairStream = streams =>
        Bacon.combineAsArray (streams.movement, streams.rotation)
             .skip (1)
             .map  (([position, gaze]) => this.world.getClosestIntersection (position, gaze))
             .diff (null, (previous, next) => [previous, next])

    // Event stream handlers

    handleResizeCamera = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix () }

    handleRotateCamera = gaze => {
        this.camera.lookAt (this.camera.position.clone().add(gaze)) }

    handleMoveCamera = position => {
        this.camera.position.x = position.x
        this.camera.position.y = position.y
        this.camera.position.z = position.z }

    handleHighlightCrosshairs = ([previous, next]) => {
        if (previous && (!next || previous.object !== next.object)) {
            previous.object.material.color.set (0xFF0000) }
        if (next && (!previous || previous.object !== next.object)) {
            next.object.material.color.set (0xFFBBBB) }}

    // Helper functions

    getMovementVector = keyCode => rotation =>
        handlers[keyCode] (rotation.clone     ()
                                   .multiply  (SQUARE)
                                   .normalize ())

    getNewPosition = (position, movement) =>
        position.addScaledVector (movement, 0.1)

    getNewRotation = (rotation, e) => {
        let dx = rotation.x - e.movementX / 500
        let dy = rotation.y + e.movementY / 500
        let rx = dx % (Math.PI * 2)
        let ry = M.clamp (dy, -yLimit, yLimit)
        return new Three.Vector2 (rx, ry) }
}
