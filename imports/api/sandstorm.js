import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema';

import { Config } from '/imports/startup/both/config';
import { getSandstormInfo, getPublicId } from '/imports/lib/sandstorm';

// This is a singleton, it contains only one record.
// We do this as a collection to enable the auto-updating.

export const SandstormInfo = new Mongo.Collection('sandstorm.info');

if (Meteor.isServer) {
  Meteor.publish('sandstorm.info', function() {
    return SandstormInfo.find();
  })
};

import FS from 'fs';
Meteor.methods({
  "sandstorm.initialize"() {
    SandstormInfo.remove({});
    const sandstormInfo = getSandstormInfo(this);
    const lines = getPublicId(sandstormInfo.sessionId);
    const lineA = lines.split('\n');
    console.log(lineA);
    sandstormInfo.publicId = lineA[0];
    sandstormInfo.publicIdPath = lineA[2];
    SandstormInfo.insert(sandstormInfo);
  }
})
