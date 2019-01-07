import _ from 'lodash'
import Cannon from 'cannon'

const blockShape = new Cannon.Box (new Cannon.Vec3 (0.5, 0.5, 0.5))
const cylinderShape = new Cannon.Cylinder (1, 1, 3, 16)
const sphereShape = new Cannon.Sphere (0.5)


// Create maps of uuids to Cannon.Body objects for blocks and entities
const blocks = {}
const entities = {}

// Create the physics world
const world = new Cannon.World ()
world.broadphase = new Cannon.NaiveBroadphase ()
world.gravity.set (0, -9.82, 0)


// API functions
function step ({ dt }) {
    world.step (dt)
    self.postMessage ({ entities: _.mapValues (entities, body => body.position) }) }

function addBlock ({ block, position }) {
    const body = new Cannon.Body ({ shape: blockShape, mass: 0 })
    body.position.set (position.x, position.y, position.z)
    world.addBody (body)
    blocks[block.uuid] = body }

function removeBlock ({ block }) {
    const body = blocks[block.uuid]
    delete blocks[block.uuid]
    world.removeBody (body) }

function addEntity ({ entity, position }) {
    const body = new Cannon.Body ({ shape: sphereShape, mass: entity.mass })
    body.position.set (position.x, position.y, position.z)
    world.addBody (body)
    entities[entity.uuid] = body }

function removeEntity ({ entity }) {
    const body = entities[entity.uuid]
    delete entities[entity.uuid]
    world.removeBody (body) }


// Attach the message listener
self.addEventListener ("message", ({ data }) => {
    if (data.message === "step")              { step (data) }
    else if (data.message === "addBlock")     { addBlock (data) }
    else if (data.message === "removeBlock")  { removeBlock (data) }
    else if (data.message === "addEntity")    { addEntity (data) }
    else if (data.message === "removeEntity") { removeEntity (data) }})
