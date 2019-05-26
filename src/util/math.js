import { Vector2, Vector3 } from 'three'


// Math utility class
export default class M {
    static clamp = (x, a, b) => Math.max (a, Math.min (b, x))

    static getDirectionVector = rotation =>
        new Vector3 (-Math.sin (rotation.x) * Math.cos (rotation.y),
                     -Math.sin (rotation.y),
                     -Math.cos (rotation.x) * Math.cos (rotation.y))
}
