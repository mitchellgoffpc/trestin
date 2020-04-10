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
    step = dt => this.worker.postMessage ({ message: "step", dt: dt ? dt / 1000 : 1 / 60 })

    addChunk = (position, blocks) =>
        this.worker.postMessage ({ message: "addChunk", position, blocks })
    addBlock = position =>
        this.worker.postMessage ({ message: "addBlock", position })
    addEntity = (uuid, position, properties) =>
        this.worker.postMessage ({ message: "addEntity", uuid, position, properties })

    removeChunk = position =>
        this.worker.postMessage ({ message: "removeChunk", position })
    removeBlock = position =>
        this.worker.postMessage ({ message: "removeBlock", position })
    removeEntity = uuid =>
        this.worker.postMessage ({ message: "removeEntity", uuid }) }
