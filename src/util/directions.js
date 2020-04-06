import keyBy from 'lodash-es/keyBy'


// Direction inner class
class Direction {
    constructor (name, axis, index, x, y, z) {
        this.name = name
        this.axis = axis
        this.index = index
        this.vector = { x, y, z }}

    toString () { return this.name }

    getAdjacentPosition ({ x, y, z }) {
        return { x: x + this.vector.x, y: y + this.vector.y, z: z + this.vector.z }}

    get opposite () {
        return Directions.Opposites[this.name] }}


// Directions enum
export default class Directions {
    static UP    = new Direction ("UP",    "y", 0,  0,  1,  0)
    static DOWN  = new Direction ("DOWN",  "y", 1,  0, -1,  0)
    static NORTH = new Direction ("NORTH", "z", 2,  0,  0,  1)
    static SOUTH = new Direction ("SOUTH", "z", 3,  0,  0, -1)
    static WEST  = new Direction ("WEST",  "x", 4,  1,  0,  0)
    static EAST  = new Direction ("EAST",  "x", 5, -1,  0,  0)

    static All =
        [Directions.UP,    Directions.DOWN,
         Directions.NORTH, Directions.SOUTH,
         Directions.WEST,  Directions.EAST]

    static Opposites =
        { [Directions.UP]:    Directions.DOWN,
          [Directions.DOWN]:  Directions.UP,
          [Directions.NORTH]: Directions.SOUTH,
          [Directions.SOUTH]: Directions.NORTH,
          [Directions.WEST]:  Directions.EAST,
          [Directions.EAST]:  Directions.WEST }

    static ByName = keyBy (Directions.All, 'name')

    static getAdjacentPositions = position =>
        Directions.All.map (direction => ({ direction, adjacentPosition: direction.getAdjacentPosition (position) }))
}
