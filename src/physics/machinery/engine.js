import _ from 'lodash'

import Joint from 'physics/machinery/joints'


export default class MachineryEngine {
    joints = []

    addMachine (machine) {
        _.forEach (machine.connections, connection => this.joints.push (connection.joint)) }

    connect (connectionA, connectionB) {
        _.pull (this.joints, connectionA.joint, connectionB.joint)

        const newJoint = new Joint (connectionA, connectionB)
        const jointA = connectionA.joint
        const jointB = connectionB.joint
        connectionA.joint = newJoint
        connectionB.joint = newJoint
        this.joints.push (newJoint)

        if (connectionB.checkPosition (newJoint, jointA.position)) {
            connectionB.updatePosition (newJoint, jointA.position, jointA.velocity) }
        else if (connectionA.checkPosition (newJoint, jointB.position)) {
            connectionA.updatePosition (newJoint, jointB.position, jointB.velocity) }
        else {
            throw new Error ("These two connections can't be joined") }}

    step () {
        _.forEach (this.joints, joint => joint.clear ())
        _.forEach (this.joints, joint => joint.calculateEffectiveMass ())
        _.forEach (this.joints, joint => this.updateJointPosition (joint)) }

    updateJointPosition (joint) {
        if (!joint.didCalculateAcceleration) {
            if (!joint.rootJointVelocity) { joint.rootJointVelocity = 0 }
            joint.rootJointVelocity += joint.getAcceleration ()

            if (joint.checkPosition (null, joint.position + joint.rootJointVelocity)) {
                joint.updatePosition (null, joint.position + joint.rootJointVelocity, joint.rootJointVelocity) }
            else if (Math.abs(joint.rootJointVelocity) > 0.001) {
                joint.rootJointVelocity *= -0.4
                joint.updatePosition (null, joint.position + joint.rootJointVelocity, joint.rootJointVelocity) }}}}
