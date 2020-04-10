import * as Three from 'three'
import map from 'lodash-es/map'
import range from 'lodash-es/range'

import Blocks from 'blocks'
import Entity from 'entities'
import M from 'util/math'
import Shapes from 'util/shapes'


// Constants

const UP               = new Three.Vector3 (0, 1, 0)
const INITIAL_POSITION = new Three.Vector3 (8, 48, 12)
const INITIAL_ROTATION = new Three.Vector2 (Math.PI, 0)

const RENDER_DISTANCE = 20
const AXES = [
    { a: 'x', b: 'z', c: 'y' },
    { a: 'z', b: 'x', c: 'y' },
    { a: 'y', b: 'x', c: 'z' }]

const getRotatedMovementVector = (movement, rotation) =>
    movement.clone () .applyAxisAngle (UP, rotation.x) .normalize ()


// Helper functions

const eq = (a, b) =>
    a.x === b.x && a.y === b.y && a.z === b.z

const getChunkPosition = ({ x, y, z }) =>
    ({ x: Math.floor (x / 16), y: Math.floor (y / 16), z: Math.floor (z / 16) })



// Player entity class

class PlayerEntity extends Entity {
    constructor (player) {
        super ({ shape: Shapes.CYLINDER, radius: 0.5, height: 2 })
        this.player = player }}


// Player class

export default class Player {
    position = INITIAL_POSITION.clone ()
    rotation = INITIAL_ROTATION.clone ()
    gaze = M.getDirectionVector (INITIAL_ROTATION)
    currentChunkPosition = getChunkPosition (INITIAL_POSITION)
    currentCrosshairTarget = null

    playerEntity = new PlayerEntity ()
    camera = new Three.PerspectiveCamera (45, 1, 0.1, 1000)


    // Constructor

    constructor (world) {
        this.world = world
        this.world.spawnEntity (this.position, this.playerEntity) }


    // Event handlers

    handleUpdateRotation = (movementX, movementY) => {
        let rx = this.rotation.x - movementX / 500
        let ry = this.rotation.y + movementY / 500
        this.rotation.x = rx % (Math.PI * 2)
        this.rotation.y = M.clamp (ry, -Math.PI / 2 + 0.0001, Math.PI / 2 - 0.0001)
        this.gaze = M.getDirectionVector (this.rotation) }

    handleResizeCamera = (width, height) => {
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix () }

    handleHighlightCrosshairTarget = (previous, next) => {
        if (next && (!previous || !eq (next, previous))) {
            this.world.setBlockHighlight (next, true) }
        if (previous && (!next || !eq (next, previous))) {
            this.world.setBlockHighlight (previous, false) }}

    handlePlaceBlock = () => {
        const target = this.currentCrosshairTarget
        if (target) this.world.placeBlockOnChunkFace (target.object.position, target.faceIndex, Blocks.Grass) }

    handleDestroyBlock = () => {
        const target = this.currentCrosshairTarget
        if (target) this.world.destroyBlockWithFace (target.object.position, target.faceIndex) }

    handleRefreshChunks = (previous, next) => {
        if (previous && !eq (previous, next)) {
            console.log (next)
            AXES.forEach (({ a, b, c }) => {
                const dir = next[a] - previous[a] > 0 ? 1 : -1
                const prevA = previous[a], prevB = previous[b]

                process.nextTick(() => {
                    for (let i = prevA, limit = next[a]; dir > 0 ? i < limit : i > limit; i += dir) {
                        for (let j = prevB - RENDER_DISTANCE; j <= prevB + RENDER_DISTANCE; j++) {
                            const positionsInBatch = range (-RENDER_DISTANCE - 1, RENDER_DISTANCE + 2)
                            // this.world.loadChunks (positionsInBatch.map (k => ({ [a]: i + (RENDER_DISTANCE + 1) * dir, [b]: j, [c]: k })))
                            // this.world.unloadChunks (positionsInBatch.map (k => ({ [a]: i - (RENDER_DISTANCE + 1) * dir, [b]: j, [c]: k })))
                        }}})

                previous[a] = next[a] }) }}


    // Update handler method

    step (dt, movement) {
        // Update our position
        this.position.addScaledVector (getRotatedMovementVector (movement, this.rotation), dt / 120)

        // Update the camera's position and rotation
        this.camera.position.x = this.position.x
        this.camera.position.y = this.position.y
        this.camera.position.z = this.position.z
        this.camera.lookAt (this.camera.position.clone () .add (this.gaze))

        // // Update the crosshair target
        // const newCrosshairTarget = this.getBlockPositionForCrosshairTarget ()
        // this.handleHighlightCrosshairTarget (this.currentCrosshairTarget, newCrosshairTarget)
        // this.currentCrosshairTarget = newCrosshairTarget

        // // Update the surrounding chunks
        // const newChunkPosition = getChunkPosition (this.position)
        // this.handleRefreshChunks (this.currentChunkPosition, newChunkPosition)
        // this.currentChunkPosition = newChunkPosition
    }


    // Helper methods

    getBlockPositionForCrosshairTarget () {
        const target = this.world.getClosestIntersection (this.position, this.gaze)
        if (target && target.distance < 10 && target.object.name === "CHUNK")
             return this.world.getBlockPositionForFaceIndex (target.object.position, target.faceIndex)
        else return null }}
