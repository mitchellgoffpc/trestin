import _ from 'lodash'
import Cannon from 'cannon'

import Shapes from 'util/shapes'


// Shape object for all blocks
const blockShape = new Cannon.Box (new Cannon.Vec3 (0.5, 0.5, 0.5))

// Create maps of uuids to Cannon.Body objects for blocks and entities
const blocks = {}
const entities = {}

// Create the physics world
const world = new Cannon.World ()
world.broadphase = new Cannon.NaiveBroadphase ()
world.gravity.set (0, -9.82, 0)

// Attach the message listener
self.addEventListener ("message", ({ data }) => {
    if (data.message === "step")              { step (data) }
    else if (data.message === "addBlock")     { addBlock (data) }
    else if (data.message === "addEntity")    { addEntity (data) }
    else if (data.message === "removeBlock")  { removeBlock (data) }
    else if (data.message === "removeEntity") { removeEntity (data) }})


// API functions

function step ({ dt }) {
    world.step (dt)
    self.postMessage ({ entities: _.mapValues (entities, body => body.position) }) }

function addBlock ({ uuid, position: { x, y, z }}) {
    const body = new Cannon.Body ({ shape: blockShape, mass: 0 })
    body.position.set (x, y, z)
    world.addBody (body)
    blocks[uuid] = body }

function addEntity ({ uuid, properties, position: { x, y, z }}) {
    const body = new Cannon.Body ({ shape: getCannonBody (properties), mass: properties.mass })
    body.position.set (x, y, z)
    world.addBody (body)
    entities[uuid] = body }

function removeBlock ({ uuid }) {
    world.removeBody (blocks[uuid])
    delete blocks[uuid] }

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
