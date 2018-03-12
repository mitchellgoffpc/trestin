import Block from 'block'

class Chunk {
    blockIds = new Uint8Array(16 * 16 * 16)
    blocks = []
    metadata = {}

    constructor (x, y) {
        this.position = [x, y]
        this.blocks.push(Block())
        this.blockIds[0] = 1 }

    render () { }}

export default Chunk
