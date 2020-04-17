import * as Three from 'three'
import dedent from 'dedent'

import Shapes from 'util/shapes'


// Shaders

const vertexShader = dedent`
    varying vec2 vUv;

    void main() {
	    vUv = uv;
	    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`


const fragmentShader = dedent`
	#include <packing>

	varying vec2 vUv;
    uniform float entityRenderDepth;
    uniform float collisionRenderDepth;
    uniform sampler2D entityDepth;
	uniform sampler2D collisionDepth;
	uniform sampler2D collisionColor;

	void main() {
		vec3 color = texture2D (collisionColor, vUv) .rgb;
        float collisionDepth = texture2D (collisionDepth, vUv) .x * collisionRenderDepth;
        float entityDepth = (1.0 - texture2D (entityDepth, vUv) .x) * entityRenderDepth;

        gl_FragColor.rgb = color;
		gl_FragColor.a = (collisionDepth - entityDepth) / collisionRenderDepth;
	}`


// Constants

const MAX_ENTITIES = 100
const MAX_COLLISION_DEPTH = 10
const GRAVITY = new Three.Vector3 (0, -0.02, 0)

const entityMaterial = new Three.MeshBasicMaterial ({ color: 0xDD9955 })
const chunkMaterial = new Three.MeshBasicMaterial ({ color: 0x559933 })

const depthMaterial = new Three.ShaderMaterial ({
    vertexShader: vertexShader.trim (),
    fragmentShader: fragmentShader.trim (),
    uniforms: {
        entityRenderDepth: { value: 0 },
        collisionRenderDepth: { value: MAX_COLLISION_DEPTH },
        entityDepth: { value: null },
        collisionDepth: { value: null },
        collisionColor: { value: null }}})


// PhysicsEntity helper class
class PhysicsEntity {
    constructor (uuid, mesh) {
        this.uuid = uuid
        this.mesh = mesh
        this.velocity = new Three.Vector3 (0, 0, 0)
        this.angularVelocity = new Three.Vector3 (0, 0, 0) }}


// PhysicsEngine class

export default class PhysicsEngine {
    camera = new Three.OrthographicCamera (-32, 32, 32, -32, 0, MAX_COLLISION_DEPTH)
    scene = new Three.Scene ()

    computeRenderTarget = new Three.WebGLRenderTarget (32, 32 * MAX_ENTITIES, { depthBuffer: false, stencilBuffer: false, type: Three.FloatType })
    computeCamera = new Three.OrthographicCamera (-.5, .5, MAX_ENTITIES, 0, 0, 200)
    computeScene = new Three.Scene ()
    computeBuffer = new Float32Array (32 * 32 * MAX_ENTITIES * 4)

    ready = true
    entities = []
    entityIndicesByUUID = {}
    entityRenderTargets = []
    collisionRenderTargets = []

    constructor () {
        const canvas = document.createElement ('canvas')
        const context = canvas.getContext ('webgl2', { antialias: false })

        this.renderer = new Three.WebGLRenderer ({ canvas, context })
        this.scene.background = new Three.Color (0xADCCFF)
        this.scene.add (new Three.AmbientLight (0x999999))
        this.computeScene.add (new Three.AmbientLight (0x999999)) }


    // API methods for creating physics bodies

    addChunk = (position, vertices, vertexCount) => {
        const mesh = new Three.Mesh (new Three.BufferGeometry (), chunkMaterial)
        mesh.geometry.setAttribute ('position', new Three.BufferAttribute (vertices, 3))
        mesh.geometry.setDrawRange (0, vertexCount / 3)
        mesh.position.set (position.x * 16, position.y * 16, position.z * 16)
        this.scene.add (mesh) }

    addBlock = position =>
        this.worker.postMessage ({ message: "addBlock", position })

    addEntity = (uuid, position, properties) => {
        const mesh = new Three.Mesh (this.createGeometry (properties), entityMaterial)
        mesh.geometry.computeBoundingSphere ()
        mesh.position.set (position.x, position.y, position.z)
        this.scene.add (mesh)

        const entityTarget = this.createRenderTarget ()
        const collisionTarget = this.createRenderTarget ()
        const computeMesh = this.createComputeMesh (this.entities.length, entityTarget, collisionTarget, mesh.geometry.boundingSphere.radius * 2)

        this.computeScene.add (computeMesh)
        this.entityRenderTargets.push (entityTarget)
        this.collisionRenderTargets.push (collisionTarget)
        this.entities.push (new PhysicsEntity (uuid, mesh))
        this.entityIndicesByUUID[uuid] = this.entities.length - 1 }

    // API methods for removing physics bodies

    removeChunk = position =>
        this.worker.postMessage ({ message: "removeChunk", position })
    removeBlock = position =>
        this.worker.postMessage ({ message: "removeBlock", position })
    removeEntity = uuid =>
        this.worker.postMessage ({ message: "removeEntity", uuid })


    // API method for performing a single physics step

    step = dt => {
        const gl = this.renderer.getContext ()

        // First, we'll check if the previous physics update is ready to be processed
        if (!this.ready) {
            if (gl.clientWaitSync (this.webGLFence, 0, 0) !== gl.TIMEOUT_EXPIRED) {
                gl.deleteSync (this.webGLFence)
                gl.bindBuffer (gl.PIXEL_PACK_BUFFER, this.webGLReadBuffer)
                gl.getBufferSubData (gl.PIXEL_PACK_BUFFER, 0, this.computeBuffer)
                gl.bindBuffer (gl.PIXEL_PACK_BUFFER, null)
                gl.deleteBuffer (this.webGLReadBuffer)

                // We have to cap the time delta on each step or we'll get huge velocity spikes when unpausing the game
                for (let i = 0; i < this.entities.length; i++) {
                    let minDepth = 1.0, minIndex = 0
                    for (let j = i * 32 * 32 * 4; j < (i + 1) * 32 * 32 * 4; j += 4) {
                        if (this.computeBuffer[j + 3] < minDepth) {
                            minDepth = this.computeBuffer[j + 3]
                            minIndex = (j - i * 32 * 32 * 4) / 4 }}

                    const { uuid, mesh, velocity, cameraRotation } = this.entities[i]
                    const speed = velocity.length ()
                    const movementVector = velocity.clone () .normalize ()
                    const distanceToCollision = minDepth * MAX_COLLISION_DEPTH
                    const boundingSphereRadius = mesh.geometry.boundingSphere.radius

                    if (distanceToCollision - speed > 0)
                        mesh.position.add (velocity)
                    else if (speed > 0.05) {
                        const x = boundingSphereRadius * 2 * (Math.floor (minIndex / 32) / 32 - 0.5)
                        const y = boundingSphereRadius * 2 * ((minIndex % 32) / 32 - 0.5)
                        const bounceVector = new Three.Vector3 (y, x, -boundingSphereRadius) .normalize ()
                        bounceVector.applyEuler (cameraRotation)

                        // mesh.position.add (movementVector.multiplyScalar (distanceToCollision - distanceToMeshBoundry))
                        velocity.copy (bounceVector.multiplyScalar (speed * 0.5))
                        if (i === 1) { console.log (velocity, velocity.length ()) }}
                    else {
                        velocity.set (0, 0, 0) }

                    this.handler (uuid, mesh.position.clone ()) }

                this.ready = true }}

        // Then we'll send the next physics update over to the GPU
        if (this.ready) {
            this.ready = false

            for (let i = 0; i < this.entities.length; i++) {
                const entity = this.entities[i]
                if (this.entityNeedsUpdate (entity)) {
                    entity.velocity.add (GRAVITY)
                    const boundingSphereRadius = entity.mesh.geometry.boundingSphere.radius
                    const movementVector = entity.velocity.clone () .normalize ()

                    this.camera.left = -boundingSphereRadius
                    this.camera.right = boundingSphereRadius
                    this.camera.top = boundingSphereRadius
                    this.camera.bottom = -boundingSphereRadius

                    // Render the entity depth
                    if (!this.entityRenderTargets[i].rendered) {
                        this.entityRenderTargets[i].rendered = true
                        this.camera.far = boundingSphereRadius * 2
                        this.camera.position.copy (entity.mesh.position.clone () .add (movementVector.multiplyScalar (boundingSphereRadius)))
                        this.camera.lookAt (entity.mesh.position.clone ())
                        this.camera.updateProjectionMatrix ()
                        this.renderer.setRenderTarget (this.entityRenderTargets[i])
                        this.renderer.render (this.scene, this.camera)
                        entity.cameraRotation = this.camera.rotation.clone () }

                    // Render the collision depth
                    this.camera.far = MAX_COLLISION_DEPTH
                    this.camera.position.copy (entity.mesh.position.clone () .add (movementVector.multiplyScalar (-boundingSphereRadius)))
                    this.camera.lookAt (entity.mesh.position.clone () .add (entity.velocity))
                    this.camera.updateProjectionMatrix ()

                    entity.mesh.visible = false
                    this.renderer.setRenderTarget (this.collisionRenderTargets[i])
                    this.renderer.render (this.scene, this.camera)
                    entity.mesh.visible = true }}

            this.renderer.setRenderTarget (this.computeRenderTarget)
            this.renderer.render (this.computeScene, this.computeCamera)

            this.webGLReadBuffer = gl.createBuffer ()
            gl.bindBuffer (gl.PIXEL_PACK_BUFFER, this.webGLReadBuffer)
            gl.bufferData (gl.PIXEL_PACK_BUFFER, this.computeBuffer.byteLength, gl.STREAM_READ)
            gl.readPixels (0, 0, 32, 32 * MAX_ENTITIES, gl.RGBA, gl.FLOAT, 0)
            gl.bindBuffer (gl.PIXEL_PACK_BUFFER, null)

            this.webGLFence = gl.fenceSync (gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
            gl.flush () }}


    // Method to create handler callback

    onStep (handler) {
        this.handler = handler }


    // Helper methods

    entityNeedsUpdate = ({ velocity: { x, y, z }}) => true
        // x !== 0 || y !== 0 || z !== 0

    createRenderTarget () {
        const target = new Three.WebGLRenderTarget (32, 32, { stencilBuffer: false, format: Three.RGBFormat })
        target.depthTexture = new Three.DepthTexture ()
        target.depthTexture.format = Three.DepthFormat
        target.depthTexture.type = Three.UnsignedShortType
        return target }

    createComputeMesh (position, entity, collision, entityRenderDepth) {
        const material = depthMaterial.clone ()
        material.uniforms.collisionColor.value = collision.texture
        material.uniforms.collisionDepth.value = collision.depthTexture
        material.uniforms.entityDepth.value = entity.depthTexture
        material.uniforms.entityRenderDepth.value = entityRenderDepth

        const computeMesh = new Three.Mesh (new Three.PlaneGeometry (1., 1.), material)
        computeMesh.position.set (0, position + 0.5, 0)
        return computeMesh }

    createGeometry (properties) {
        if (properties.shape === Shapes.BOX)
            return new Three.BoxGeometry (properties.x, properties.y, properties.z)
        else if (properties.shape === Shapes.SPHERE)
            return new Three.SphereGeometry (properties.radius, 16, 12)
        else if (properties.shape === Shapes.CYLINDER)
            return new Three.CylinderGeometry (properties.radius, properties.radius, properties.height, 16) }
}
