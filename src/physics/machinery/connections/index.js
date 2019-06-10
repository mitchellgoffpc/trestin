import Machine from 'blocks/machines'
import Joint from 'physics/machinery/joints'

const id = x => x


export default class Connection {
    joint = new Joint (this)

    constructor (machine, properties = {}) {
        const { input = id,
                output = id,
                massMultiplier = () => 1,
                accelerationInverted = false } = properties

        this.machine = machine
        this.input = input
        this.output = output
        this.massMultiplier = massMultiplier
        this.accMultiplier = () => {
            const invert = _.isFunction (accelerationInverted) ? accelerationInverted () : accelerationInverted
            return this.massMultiplier () * (invert ? -1 : 1) }}

    getEffectiveMass (connection) { return 1 }

    getAcceleration (connection) {
        if (connection === this.machine)
             return this.joint.getAcceleration (this) / this.accMultiplier ()
        else if (connection === this.joint)
             return this.machine.getAcceleration (this) * this.accMultiplier ()
        else throw new Error ("Incoming connection not recognized") }

    checkPosition (connection, position) {
        if (connection === this.machine)
             return this.joint.checkPosition (this, this.output (position))
        else if (connection === this.joint)
             return this.machine.checkPosition (this, this.input (position))
        else throw new Error ("Incoming connection not recognized") }

    updatePosition (connection, position, velocity) {
        if (connection === this.machine) {
             const jointPosition = this.output (position)
             const jointVelocity = jointPosition - this.output (position - velocity)
             this.joint.updatePosition (this, jointPosition, jointVelocity) }
        else if (connection === this.joint) {
             const basePosition = this.input (position)
             const baseVelocity = basePosition - this.input (position - velocity)
             this.machine.updatePosition (this, basePosition, baseVelocity) }
        else throw new Error ("Incoming connection not recognized") }}
