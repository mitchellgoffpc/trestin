import { vec2 as v2,
         vec3 as v3 } from 'gl-matrix'

class M {
    static clamp = (x, a, b) => Math.max(a, Math.min(b, x))
    static fromValues = (...args) => new Chain (...args)
}

class Chain {
    constructor (...args) {
        if (args.length == 1) {
            this._value = args[0]
        } else if (args.length == 2) {
            this._value = v2.fromValues (...args)
        } else if (args.length == 3) {
            this._value = v3.fromValues (...args)
        } else {
            throw Exception("Invalid number of arguments") }

        let type = this._value.length == 2 ? v2 : v3
        for (var k in type) {
            let key = k.slice()
            this[key] = function (...args) {
                var result = type.create ()
                type[key] (result, this._value, ...args)
                return new Chain (result)
            }.bind(this) }}

    value = () => this._value
}

export default M
