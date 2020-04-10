import Cannon from 'cannon'
import map from 'lodash-es/map'

import Shapes from 'util/shapes'
import { getBlockIndex } from 'util/coordinates'


// Shape object for all blocks
const blockShape = new Cannon.Box (new Cannon.Vec3 (0.5, 0.5, 0.5))

// Create maps of uuids to Cannon.Body objects for blocks and entities
const chunks = {}
const entities = {}

// Create the physics world
const world = new Cannon.World ()
world.gravity.set (0, -18, 0)
world.broadphase = new Cannon.NaiveBroadphase ()
world.solver.iterations = 4

// Attach the message listener
self.addEventListener ("message", ({ data }) => {
    if (data.message === "step")              { step (data) }
    else if (data.message === "addChunk")     { addChunk (data) }
    else if (data.message === "addBlock")     { addBlock (data) }
    else if (data.message === "addEntity")    { addEntity (data) }
    else if (data.message === "removeBlock")  { removeBlock (data) }
    else if (data.message === "removeEntity") { removeEntity (data) }})


// API functions

function step ({ dt }) {
    world.step (dt)
    self.postMessage ({ entities: map (entities, ({ position }, uuid) => ({ uuid, ...position })) }) }


// Functions for creating physics bodies

function addBlock ({ uuid, position: { x, y, z }}) { }

function addChunk ({ uuid, blocks, position }) {
    const body = new Cannon.Body ({ mass: 0 })

    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            let minY = 0, maxY = 0

            for (let y = 0; y < 16; y++) {
                if (blocks[getBlockIndex (x, y, z)]) { // If this block is solid...
                    if (maxY > minY) { maxY += 1 } // If we already have a bounding box going, just extend it upwards by one block
                    else { minY = y, maxY = y + 1 }} // Otherwise, start a new bounding box

                else if (maxY > minY) { // If this is an air block and we have a bounding box going, add the BB to the chunk's physics body
                    const halfHeight = (maxY - minY) / 2
                    body.addShape (new Cannon.Box (new Cannon.Vec3 (0.5, halfHeight, 0.5)),
                                   new Cannon.Vec3 (x + 0.5, minY + halfHeight, z + 0.5))
                    minY = maxY }}}}

    body.position.set (position.x * 16, position.y * 16, position.z * 16)
    world.addBody (body)
    chunks[uuid] = body }

function addEntity ({ uuid, properties, position: { x, y, z }}) {
    if (properties.shape === Shapes.SPHERE) { console.log ("Adding sphere") }
    const body = new Cannon.Body ({ shape: getCannonBody (properties), mass: properties.mass })
    body.position.set (x, y, z)
    world.addBody (body)
    entities[uuid] = body }


// Functions for removing physics bodies

function removeBlock ({ uuid, position: { x, y, z }}) { }

function removeChunk ({ uuid }) {
    world.removeBody (chunks[uuid])
    delete chunks[uuid] }

function removeEntity ({ uuid }) {
    world.removeBody (entities[uuid])
    delete entities[uuid] }


// Helper functions

const getCannonBody = properties => do {
    if (properties.shape === Shapes.BOX)
        new Cannon.Box (new Cannon.Vec3 (properties.x / 2, properties.y / 2, properties.z / 2))
    else if (properties.shape === Shapes.SPHERE)
        new Cannon.Sphere (properties.radius)
    else if (properties.shape === Shapes.CYLINDER)
        getRotatedCylinder (properties) }

const getRotatedCylinder = properties => {
    const cylinder = new Cannon.Cylinder (properties.radius, properties.radius, properties.height, 16)
    const translation = new Cannon.Vec3 (0, 0, 0)
    const rotation = new Cannon.Quaternion ()
    rotation.setFromAxisAngle (new Cannon.Vec3 (1, 0, 0), -Math.PI / 2)
    cylinder.transformAllPoints (translation, rotation)
    return cylinder }
