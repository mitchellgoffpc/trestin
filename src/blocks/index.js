import map from 'lodash-es/map'
import chunk from 'lodash-es/chunk'
import flatten from 'lodash-es/flatten'
import fromPairs from 'lodash-es/fromPairs'
import pickBy from 'lodash-es/pickBy'


// Helper functions
const repeat = (data, n) => {
    let result = new Array (n)
    result.fill (data)
    return result }

const hexToFloats = hexCode => {
    let components = chunk (hexCode.substr (1), 2) .map (x => parseInt (x.join (''), 16) / 0xFF)
    return Float32Array.from (flatten (repeat (components, 3))) }


// Block base class
class Block {
    constructor (ID, colors, highlightColors) {
        this.ID = ID
        this.colorData = map (colors, hexToFloats)
        this.highlightColorData = map (highlightColors, hexToFloats) }}


// Block types
export default class Blocks {
    static Dirt  = new Block (1, repeat ('#D68653', 12), repeat ('#E3A066', 12))
    static Grass = new Block (2, ['#369940', '#369940', ...repeat ('#D68653', 10)],
                                 ['#43B353', '#43B353', ...repeat ('#E3A066', 10)])

    static All = pickBy (Blocks, value => value instanceof Block)
    static BlocksByID = fromPairs (map (Blocks.All, block => [block.ID, block]))

    static fromBlockID (ID) {
        return Blocks.BlocksByID[ID] }}
