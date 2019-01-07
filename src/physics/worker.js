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

function addBlock ({ block, position }) {
    const body = new Cannon.Body ({ shape: blockShape, mass: 0 })
    body.position.set (position.x, position.y, position.z)
    world.addBody (body)
    blocks[block.uuid] = body }

function addEntity ({ entity, position }) {
    const body = new Cannon.Body ({ shape: getShape (entity), mass: entity.mass })
    body.position.set (position.x, position.y, position.z)
    world.addBody (body)
    entities[entity.uuid] = body }

function removeBlock ({ block }) {
    const body = blocks[block.uuid]
    delete blocks[block.uuid]
    world.removeBody (body) }

function removeEntity ({ entity }) {
    const body = entities[entity.uuid]
    delete entities[entity.uuid]
    world.removeBody (body) }


// Helper functions

const getShape = entity => do {
    if (entity.shape === Shapes.BOX)
        new Cannon.Box (new Cannon.Vec3 (entity.x / 2, entity.y / 2, entity.z / 2))
    else if (entity.shape === Shapes.SPHERE)
        new Cannon.Sphere (entity.radius)
    else if (entity.shape === Shapes.CYLINDER)
        new Cannon.Cylinder (entity.radius, entity.radius, entity.height, 16) }
