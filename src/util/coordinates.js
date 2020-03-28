// This file just contains some helper functions from switching from string coordinates to
// position objects and back

export const coords = (x, y, z) => `${x},${y},${z}`
export const getCoordsForPosition = ({ x, y, z }) => coords (x, y, z)
export const getPositionForCoords = coordinates => {
    let [x, y, z] = coordinates.split (',') .map (x => parseInt (x))
    return { x, y, z }}
