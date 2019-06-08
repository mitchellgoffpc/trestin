import _ from 'lodash'


export default class MachineryEngine {
    nodes = []

    addMachine (machine) {
        _.forEach (machine.connections, node => this.nodes.push (node)) }

    connect (a, b) {
        const fieldA = this.getField (a)
        const fieldB = this.getField (b)
        const machineA = a[fieldA].machine
        const machineB = b[fieldB].machine
        const connectionKey = _.findKey (machineB.connections, x => x === b)

        a[fieldA === 'left' ? 'right' : 'left'] = { machine: machineB }
        machineB.connections[connectionKey] = a
        machineB.updatePosition (a, a.position)
        _.pull(this.nodes, b) }

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
        _.forEach (this.nodes, node => this.updateNodePosition (node)) }

    updateNodePosition (node) {
        if (!node.didCalculateAcceleration) {
            if (!node.rootNodeVelocity) { node.rootNodeVelocity = 0 }
            node.rootNodeVelocity += node.getAcceleration ()

            if (node.checkPosition (null, node.position + node.rootNodeVelocity)) {
                node.updatePosition (null, node.position + node.rootNodeVelocity) }
            else if (Math.abs(node.rootNodeVelocity) > 0.001) {
                node.rootNodeVelocity *= -0.4
                node.updatePosition (null, node.position + node.rootNodeVelocity) }}}}
