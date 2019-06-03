export default class Connection {
    left = null
    right = null
    position = 0

    constructor (machine) {
        this.left = { machine }}

    clear () {
        this.didCalculateAcceleration = false

        if (this.left) {
            this.left.effectiveMass = 0 }
        if (this.right) {
            this.right.effectiveMass = 0 }}

    calculateEffectiveMass () {
        if (this.left) {
            this.left.effectiveMass = this.left.machine.getEffectiveMass (this.left) }
        if (this.right) {
            this.right.effectiveMass = this.right.machine.getEffectiveMass (this.right) }}

    getAcceleration (connection) {
        this.didCalculateAcceleration = true

        let deltaV = 0
        if (this.left && this.left.machine !== connection) {
            deltaV += this.left.machine.getAcceleration (this) }
        if (this.right && this.right.machine !== connection) {
            deltaV += this.right.machine.getAcceleration (this) }
        return deltaV }

    updatePosition (sender, position) {
        if (this.left && this.left.machine !== sender) {
            this.left.machine.updatePosition (this, position) }
        if (this.right && this.right.machine !== sender) {
            this.right.machine.updatePosition (this, position) }

        this.position = position }}
