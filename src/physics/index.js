import PhysicsWorker from 'physics/worker'


// Inner classes for dealing with blocks and entities
class Block {
    isBlock = true

    constructor (uuid) {
        this.uuid = uuid }}

class Entity {
    isEntity = true

    constructor (uuid, mass) {
        this.uuid = uuid
        this.mass = mass }}


// PhysicsEngine class
export default class PhysicsEngine {
    static Block = Block
    static Entity = Entity

    constructor () {
        this.worker = new PhysicsWorker ()
        this.worker.addEventListener ("message", this.handleMessage) }

    handleMessage = e => {
        if (this.handler) {
            this.handler (e.data) }}

    onStep = handler => {
        this.handler = handler }

    // API Methods
    step = dt => this.worker.postMessage ({ message: "step", dt: dt || 1 / 60 })

    addBlock = (block, x, y, z) =>
        this.worker.postMessage ({ message: "addBlock", position: { x, y, z }, block })
    addEntity = (entity, x, y, z) =>
        this.worker.postMessage ({ message: "addEntity", position: { x, y, z }, entity })

    removeBlock = block =>
        this.worker.postMessage ({ message: "removeBlock", block })
    removeEntity = entity =>
        this.worker.postMessage ({ message: "removeEntity", entity })
}
