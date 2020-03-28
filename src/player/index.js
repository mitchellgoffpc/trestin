import _ from 'lodash'
import Bacon from 'baconjs'
import * as Three from 'three'

import Entity from 'entities'
import { Grass } from 'blocks'
import M from 'util/math'
import Shapes from 'util/shapes'


// Constants
const UP = new Three.Vector3 (0, 1, 0)
const DOWN = new Three.Vector3 (0, -1, 0)
const SQUARE = new Three.Vector3 (1, 0, 1)

const truthy = Boolean
const yLimit = Math.PI / 2 - 0.0001
const initialRotation = new Three.Vector2 (0, 0)
const initialPosition = new Three.Vector3 (8, 5, 12)

const handlers = {
    16: () => DOWN,
    32: () => UP,
    65: forward => forward.cross (DOWN),
    68: forward => forward.cross (UP),
    83: forward => forward.negate (),
    87: forward => forward }

const eq = (a, b) =>
    a.x === b.x && a.y === b.y && a.z === b.z


// Player entity class

class PlayerEntity extends Entity {
    constructor (player) {
        super ({ shape: Shapes.CYLINDER, radius: 0.5, height: 2 })
        this.player = player }}


// Player class

export default class Player {
    camera = new Three.PerspectiveCamera (45, 1, 0.1, 1000)

    constructor (streams, world) {
        let playerEntity = new PlayerEntity()

        this.handleResizeCamera ()
        this.createEventStreams (streams)

        this.world = world
        this.world.spawnEntity (initialPosition, playerEntity)

        this.streams.resize.onValue (this.handleResizeCamera)
        this.streams.movement.onValue (this.handleMoveCamera)
        this.streams.rotation.onValue (this.handleRotateCamera)

        this.streams.placeBlock.onValue (this.handlePlaceBlock)
        this.streams.destroyBlock.onValue (this.handleDestroyBlock)
        this.streams.crosshairTarget
            .map     (this.getBlockPositionForFaceIndex)
            .diff    (null, (previous, next) => [previous, next])
            .onValue (this.handleHighlightCrosshairTarget) }


    // Create the event streams for this player

    createEventStreams = streams => {
        this.streams = { ...streams }
        this.streams.rotation = this.createRotationStream (this.streams)
        this.streams.movement = this.createMovementStream (this.streams)

        this.streams.crosshairTarget = this.createCrosshairTargetStream (this.streams)
        this.streams.destroyBlock = this.createDestroyBlockStream (this.streams)
        this.streams.placeBlock = this.createPlaceBlockStream (this.streams) }

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
                       .sampledBy (streams.draw)
                       .filter    (truthy)
                       .map       (streams.rotation)
                       .map       (this.getMovementVector (keyCode)) })

        return Bacon.mergeAll (movementStreams)
                    .scan     (initialPosition, this.getNewPosition) }

    createCrosshairTargetStream = streams =>
        Bacon.combineAsArray (streams.movement, streams.rotation)
             .skip   (1)
             .map    (([position, gaze]) => this.world.getClosestIntersection (position, gaze))

    createPlaceBlockStream = streams =>
        streams.leftClickDown.filter (streams.controlsEnabled)
                             .map    (streams.crosshairTarget)

    createDestroyBlockStream = streams =>
        streams.rightClickDown.filter (streams.controlsEnabled)
                              .map    (streams.crosshairTarget)


    // Event stream handlers

    handleResizeCamera = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix () }

    handleRotateCamera = gaze => {
        this.camera.lookAt (this.camera.position.clone () .add (gaze)) }

    handleMoveCamera = position => {
        this.camera.position.x = position.x
        this.camera.position.y = position.y
        this.camera.position.z = position.z }

    handleHighlightCrosshairTarget = ([previous, next]) => {
        if (next && (!previous || !eq (next, previous))) {
            this.world.setBlockHighlight (next, true) }
        if (previous && (!next || !eq (next, previous))) {
            this.world.setBlockHighlight (previous, false) }}

    handlePlaceBlock = target =>
        this.world.placeBlockOnChunkFace (target.object.position, target.faceIndex, Grass)

    handleDestroyBlock = target =>
        this.world.destroyBlockWithFace (target.object.position, target.faceIndex)


    // Helper functions

    getMovementVector = keyCode => gaze =>
        handlers[keyCode] (gaze.clone     ()
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

    getBlockPositionForFaceIndex = target => do {
        if (target)
             this.world.getBlockPositionForFaceIndex (target.object.position, target.faceIndex)
        else null }}
