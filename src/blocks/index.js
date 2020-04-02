import _ from 'lodash'

// Helper function
const replicate = (data, n) => _.flatten (_.times (n, () => data))


// Block class
class Block {
    constructor (ID, color, highlightColor) {
        this.ID = ID
        this.colorData = replicate (color, 3)
        this.highlightColorData = replicate (highlightColor, 3) }}


// Block types
export default class Blocks {
    static Dirt  = new Block (1, [.9, .525, .325], [.95, .625, .4])
    static Grass = new Block (2, [.215, .6, .25], [.265, .7, .325])

    static All = _.pickBy (Blocks, value => value instanceof Block)
    static BlocksByID = _.fromPairs (_.map (Blocks.All, block => [block.ID, block]))

    static fromBlockID (ID) {
        return Blocks.BlocksByID[ID] }}
