import { vec2 as v2, vec3 as v3 } from 'gl-matrix'

import M from 'util/math'


// Player class
class Player {
    position = v3.fromValues(0, 0, -20)
    rotation = v2.fromValues(0, 0)

    constructor (streams) {
        this.initializePointerHandlers (streams)
        this.initializeKeyboardHandlers (streams) }

    move = direction =>
        v3.add (this.position, this.position, direction.scale(0.2).value())

    // Initialize event stream handlers
    initializePointerHandlers (streams) {
        streams.gazeMove.onValue (e => {
            let yLimit = Math.PI / 2 - 0.0001
            let dx = this.rotation[0] + e.movementX / 500,
                dy = this.rotation[1] + e.movementY / 500
            let rx = dx % (Math.PI * 2),
                ry = M.clamp (dy, -yLimit, yLimit)
            v2.set (this.rotation, rx, ry) })}

    initializeKeyboardHandlers (streams) {
        let handlers = {
            16: () => this.move (M.fromValues (0, -1, 0)),
            32: () => this.move (M.fromValues (0, +1, 0)),
            65: forward => this.move (forward.cross (v3.fromValues (0, -1, 0))),
            68: forward => this.move (forward.cross (v3.fromValues (0, +1, 0))),
            83: forward => this.move (forward.negate ()),
            87: forward => this.move (forward) }

        for (var key in handlers) {
            let keyCode = parseInt(key)
            let down = streams.keyDown.filter(e => e.which == keyCode)
            let up = streams.keyUp.filter(e => e.which == keyCode)
            let moving = down.awaiting (up)
                             .sampledBy (streams.timer)
                             .filter (Boolean)

            moving.onValue(e => {
                let forward = M.getDirectionVector (this.rotation)
                    .multiply (v3.fromValues (1, 0, 1))
                    .normalize ()

                handlers[keyCode] (forward) })} }}


export default Player
