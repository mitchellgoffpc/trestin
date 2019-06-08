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
        else {
            this.right.effectiveMass = this.right.machine.getEffectiveMass (this.right) }}

    getAcceleration (connection) {
        this.didCalculateAcceleration = true

        let deltaV = 0
        if (this.left && this.left.machine !== connection) {
            deltaV += this.left.machine.getAcceleration (this) }
        else if (this.right && this.right.machine !== connection) {
            deltaV += this.right.machine.getAcceleration (this) }
        return deltaV }

    checkPosition (connection, position) {
        let flag = true
        if (this.left && this.left.machine !== connection) {
            flag = flag && this.left.machine.checkPosition (this, position) }
        if (this.right && this.right.machine !== connection) {
            flag = flag && this.right.machine.checkPosition (this, position) }

        return flag }

    updatePosition (connection, position) {
        this.position = position
        if (!connection || this.left && this.right) {
            if (this.left.machine !== connection) {
                this.left.machine.updatePosition (this, position) }
            else if (this.right.machine !== connection) {
                this.right.machine.updatePosition (this, position) }}}}
