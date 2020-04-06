import Block from 'blocks'


export default class Machine extends Block {
    basePosition = 0
    baseVelocity = 0

    getEffectiveMass (connection) { return 1 }

    getAcceleration (connection) {
        return this.getBaseForce (this.basePosition, this.baseVelocity) +
               _(this.connections).filter (x => x !== connection)
                                  .sumBy  (x => x.getAcceleration (this)) }

    checkPosition (connection, position) {
        return this.checkBasePosition (position) &&
               _(this.connections).filter (x => x !== connection)
                                  .every  (x => x.checkPosition (this, position)) }

    updatePosition (connection, position, velocity) {
        this.updateBasePosition (position, velocity)
        _(this.connections).filter  (x => x !== connection)
                           .forEach (x => x.updatePosition (this, position, velocity)) }

    // Stub methods to modify the behavior of the base node
    getBaseForce (position, velocity) { return 0 }
    checkBasePosition (position) { return true }
    updateBasePosition (position, velocity) {
        this.basePosition = position
        this.baseVelocity = velocity }}
