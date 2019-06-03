import Block from 'blocks'


export default class Machine extends Block {
    getEffectiveMass (connection) {
        return 1 }

    getAcceleration (connection) {
        return _.chain  (this.connections)
                .filter (x => x !== connection)
                .sumBy  (x => x.getAcceleration (this))
                .value  () }}
