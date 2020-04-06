import PhysicsWorker from 'physics/engine.worker'


// PhysicsEngine class
export default class PhysicsEngine {
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

    addBlock = (x, y, z, uuid) =>
        this.worker.postMessage ({ message: "addBlock", uuid, position: { x, y, z }})
    addEntity = (x, y, z, uuid, properties) =>
        this.worker.postMessage ({ message: "addEntity", uuid, properties, position: { x, y, z }})

    removeBlock = uuid =>
        this.worker.postMessage ({ message: "removeBlock", uuid })
    removeEntity = uuid =>
        this.worker.postMessage ({ message: "removeEntity", uuid }) }
