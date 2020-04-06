import Directions from 'util/directions'


// Helper functions for converting block indices into position objects and back

export const getBlockIndex = (x, y, z) =>
    (x << 8) + (y << 4) + z

export const getBlockIndexForPosition = ({ x, y, z }) =>
    getBlockIndex (x, y, z)

export const getPositionForBlockIndex = blockIndex =>
    ({ x: blockIndex >> 8, y: (blockIndex >> 4) & 0xF, z: blockIndex & 0xF })

export const positionIsWithinChunk = ({ x, y, z }) =>
    x >= 0 && x <= 0xF &&
    y >= 0 && y <= 0xF &&
    z >= 0 && z <= 0xF
