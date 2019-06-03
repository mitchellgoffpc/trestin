import GeometryBuilder from 'util/geometry'


export default class Pivot {
    static createMesh (caseColor, pinColor) {
        const builder = new GeometryBuilder ()

        builder.addBox ({ dx: .3, dy: .1, dz: .3, color: caseColor })
        builder.addBox ({ dx: .3, dy: .5, dz: .05, y: .3, z: -.125, color: caseColor })
        builder.addBox ({ dx: .3, dy: .5, dz: .05, y: .3, z: .125, color: caseColor })
        builder.addCylinder ({ r: .05, h: .45, y: .35, rx: Math.PI / 2, color: pinColor })

        return builder.getMesh () }
}
