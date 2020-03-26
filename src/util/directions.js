import { Vector3 } from 'three'


// Direction inner class
class Direction {
    constructor (name, axis, x, y, z) {
        this.name = name
        this.axis = axis
        this.vector = new Vector3 (x, y, z) }

    toString = () => this.name
    toUnitVector = () => this.vector.clone() }


// Directions enum
export default class Directions {
    static UP    = new Direction ("UP", "y", 0, 1, 0)
    static DOWN  = new Direction ("DOWN", "y", 0, -1, 0)
    static NORTH = new Direction ("NORTH", "z", 0, 0, 1)
    static SOUTH = new Direction ("SOUTH", "z", 0, 0, -1)
    static WEST  = new Direction ("WEST", "x", 1, 0, 0)
    static EAST  = new Direction ("EAST", "x", -1, 0, 0)

    static getDirectionFromFaceIndex = faceIndex => do {
        if (faceIndex === 0 || faceIndex === 1)
             Directions.WEST
        else if (faceIndex === 2 || faceIndex === 3)
             Directions.EAST
        else if (faceIndex === 4 || faceIndex === 5)
             Directions.UP
        else if (faceIndex === 6 || faceIndex === 7)
             Directions.DOWN
        else if (faceIndex === 8 || faceIndex === 9)
             Directions.NORTH
        else Directions.SOUTH }}
