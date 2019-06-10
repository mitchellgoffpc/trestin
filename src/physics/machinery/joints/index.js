export default class Joint {
    left = null
    right = null
    position = 0
    velocity = 0

    constructor (left, right) {
        if (left) { this.left = { connection: left }}
        if (right) { this.right = { connection: right }}}

    clear () {
        this.didCalculateAcceleration = false

        if (this.left) {
            this.left.effectiveMass = 0 }
        if (this.right) {
            this.right.effectiveMass = 0 }}

    calculateEffectiveMass () {
        if (this.left) {
            this.left.effectiveMass = this.left.connection.getEffectiveMass (this.left) }
        else if (this.right) {
            this.right.effectiveMass = this.right.connection.getEffectiveMass (this.right) }
        else {
            throw new Error ("Neither side of this joint is connected to anything") }}

    getAcceleration (connection) {
        this.didCalculateAcceleration = true

        let deltaV = 0
        if (this.left && this.left.connection !== connection) {
            deltaV += this.left.connection.getAcceleration (this) }
        if (this.right && this.right.connection !== connection) {
            deltaV += this.right.connection.getAcceleration (this) }
        return deltaV }

    checkPosition (connection, position) {
        let flag = true
        if (this.left && this.left.connection !== connection) {
            flag = flag && this.left.connection.checkPosition (this, position) }
        if (this.right && this.right.connection !== connection) {
            flag = flag && this.right.connection.checkPosition (this, position) }
        return flag }

    updatePosition (connection, position, velocity) {
        this.position = position
        this.velocity = velocity
        if (this.left && this.left.connection !== connection) {
            this.left.connection.updatePosition (this, position, velocity) }
        if (this.right && this.right.connection !== connection) {
            this.right.connection.updatePosition (this, position, velocity) }}}
