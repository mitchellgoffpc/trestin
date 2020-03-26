import _ from 'lodash'

// Helper function
const replicate = (data, n) => _.flatten (_.times (n, () => data))


// Block class
class Block {
    constructor (color, highlightColor) {
        this.colorData = replicate (color, 3)
        this.highlightColorData = replicate (highlightColor, 3) }}


// Block types
export const Dirt = new Block([.9, .525, .325], [.95, .625, .4])
export const Grass = new Block([.215, .6, .25], [.265, .7, .325])
