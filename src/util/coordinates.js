// This file just contains some helper functions from switching from block indices
// to coordinate objects and back

export const coords = (x, y, z) =>
    x >= 0 && x <= 0xF &&
    y >= 0 && y <= 0xF &&
    z >= 0 && z <= 0xF
        ? (x << 8) + (y << 4) + z
        : null

export const getCoordsForPosition = ({ x, y, z }) =>
    coords (x, y, z)

export const getPositionForCoords = coordinates =>
    ({ x: coordinates >> 8, y: (coordinates >> 4) & 0xF, z: coordinates & 0xF })
