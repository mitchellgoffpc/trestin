import * as Three from 'three'


// Utility class for creating Three.js meshes

export default class GeometryBuilder {
    group = new Three.Group ()

    getMesh () { return this.group }

    addBox ({ x, y, z, rx, ry, rz, dx, dy, dz, color, faces = 16 }) {
        const geometry = new Three.BoxGeometry (dx, dy, dz, faces)
        const material = new Three.MeshLambertMaterial ({ color })
        const mesh = new Three.Mesh (geometry, material)
        return this.addMesh ({ mesh, x, y, z, rx, ry, rz }) }

    addCylinder ({ x, y, z, rx, ry, rz, r, h, color, faces = 16 }) {
        const geometry = new Three.CylinderGeometry (r, r, h, faces)
        const material = new Three.MeshLambertMaterial ({ color })
        const mesh = new Three.Mesh (geometry, material)
        return this.addMesh ({ mesh, x, y, z, rx, ry, rz }) }

    addSubgroup ({ x, y, z, rx, ry, rz }) {
        const builder = new GeometryBuilder ()
        const mesh = builder.getMesh ()

        this.addMesh ({ mesh, x, y, z, rx, ry, rz })
        return builder }

    addMesh ({ mesh, x, y, z, rx, ry, rz }) {
        if (x) { mesh.position.setX (x) }
        if (y) { mesh.position.setY (y) }
        if (z) { mesh.position.setZ (z) }

        if (rx) { mesh.rotation.x = rx }
        if (ry) { mesh.rotation.y = ry }
        if (rz) { mesh.rotation.z = rz }

        this.group.add (mesh)
        return mesh }
}
