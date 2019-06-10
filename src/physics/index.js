// Physics classes for dealing with blocks and entities

export class PhysicsBlock {
    constructor (uuid) {
        this.uuid = uuid }}

export class PhysicsEntity {
    constructor (uuid, properties) {
        this.uuid = uuid
        _.forEach (properties, (value, key) => { this[key] = value }) }}
