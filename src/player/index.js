import _ from 'lodash'
import * as Three from 'three'

const UP = new Three.Vector3 (0, 1, 0)
const DOWN = new Three.Vector3 (0, -1, 0)
const SQUARE = new Three.Vector3 (1, 0, 1)


// Player class
class Player {
    constructor (streams) {
        let aspectRatio = window.innerWidth / window.innerHeight
        this.camera = new Three.PerspectiveCamera (75, aspectRatio, 0.1, 1000)
        this.camera.position.z = 5

        this.initializePointerHandlers (streams)
        this.initializeKeyboardHandlers (streams)
        streams.resize.onValue (this.handleResizeCamera) }

    handleResizeCamera = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix () }

    // Initialize event stream handlers
    initializePointerHandlers = streams => {
        let initialRotation = new Three.Vector2 (0, 0)
        let yLimit = Math.PI / 2 - 0.0001

        this.rotation = streams.mouseMove
            .filter (streams.controlsEnabled)
            .reduce (initialRotation, (rotation, e) => {
                let dx = rotation.x - e.movementY / 500
                let dy = rotation.y - e.movementX / 500
                let rx = dx % (Math.PI * 2)
                let ry = M.clamp (dy, -yLimit, yLimit)
                return new Three.Vector2 (rx, ry) })

        this.rotation.onValue (gaze => {
            this.camera.rotation.x = gaze.x
            this.camera.rotation.y = gaze.y }) }

    initializeKeyboardHandlers = streams => {
        let initialPosition = new Three.Vector3 (0, 0, 5)
        let handlers = {
            16: () => DOWN,
            32: () => UP,
            65: forward => forward.cross (DOWN),
            68: forward => forward.cross (UP),
            83: forward => forward.negate (),
            87: forward => forward }

        let movementStreams = _.keys(handlers).map (key => {
            let keyCode = parseInt (key)
            let down = streams.keyDown.filter (e => e.which == keyCode)
            let up = streams.keyUp.filter (e => e.which == keyCode)

            return down.awaiting  (up)
                       .filter    (streams.controlsEnabled)
                       .sampledBy (streams.timer)
                       .map       (this.rotation)
                       .map       (rotation => {
                           let forward = M.getDirectionVector (rotation)
                                          .multiply (SQUARE)
                                          .normalize ()

                           return handlers[keyCode] (forward) })})

        Bacon.mergeAll (movementStreams)
             .reduce   (initialPosition, (position, direction) =>
                position.addScaledVector (direction, 0.2))
             .onValue  (position => {
                this.camera.position.x = position.x
                this.camera.position.y = position.y
                this.camera.position.z = position.z }) }}


export default Player
