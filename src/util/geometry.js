import Directions from 'util/directions'


// Helper function to get the vertices one side of a block

export const getVerticesForSide = ({ x, y, z }, direction) => do {
    if (direction === Directions.UP)
        [x, y + 1, z,  x + 1, y + 1, z + 1,  x + 1, y + 1, z,
         x, y + 1, z,  x, y + 1, z + 1,      x + 1, y + 1, z + 1]
    else if (direction === Directions.DOWN)
        [x, y, z,      x + 1, y, z,          x + 1, y, z + 1,
         x, y, z,      x + 1, y, z + 1,      x, y, z + 1]
    else if (direction === Directions.NORTH)
        [x, y, z + 1,  x + 1, y, z + 1,      x + 1, y + 1, z + 1,
         x, y, z + 1,  x + 1, y + 1, z + 1,  x, y + 1, z + 1]
    else if (direction === Directions.SOUTH)
        [x, y, z,      x + 1, y + 1, z,      x + 1, y, z,
         x, y, z,      x, y + 1, z,          x + 1, y + 1, z]
    else if (direction === Directions.WEST)
        [x + 1, y, z,  x + 1, y + 1, z + 1,  x + 1, y, z + 1,
         x + 1, y, z,  x + 1, y + 1, z,      x + 1, y + 1, z + 1]
    else if (direction === Directions.EAST)
        [x, y, z,      x, y, z + 1,          x, y + 1, z + 1,
         x, y, z,      x, y + 1, z + 1,      x, y + 1, z] }
