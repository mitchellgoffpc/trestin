import _ from 'lodash'


export default class Machine {
    nodes = []
    rootNodeVelocity = 0

    constructor (...machines) {
        _.forEach (machines, machine =>
            _.forEach (machine.connections, node => this.nodes.push (node))) }

    connect (a, b) {
        const fieldA = this.getField (a)
        const fieldB = this.getField (b)
        const machineA = a[fieldA].machine
        const machineB = b[fieldB].machine

        a[fieldA === 'left' ? 'right' : 'left'] = { machine: machineB }
        machineB.connections.beam = a
        machineB.updatePosition (a, a.position) }

    getField (x) {
        if (x.left && x.right) {
            throw new Error ("Both sides of this connection are attached to machines!") }
        else if (!x.left && !x.right) {
            throw new Error ("Neither side of this connection is attached to anything!") }
        else if (x.left) {
            return 'left' }
        else {
            return 'right' }}

    step () {
        _.forEach (this.nodes, node => node.clear ())
        _.forEach (this.nodes, node => node.calculateEffectiveMass ())

        const rootNode = _.first (this.nodes)
        this.rootNodeVelocity += rootNode.getAcceleration ()
        try {
            rootNode.updatePosition (null, rootNode.position + this.rootNodeVelocity) }
        catch (exception) {
            this.rootNodeVelocity *= -0.5
            if (Math.abs(this.rootNodeVelocity) > 0.001) {
                rootNode.updatePosition (null, rootNode.position + this.rootNodeVelocity) }}}}
