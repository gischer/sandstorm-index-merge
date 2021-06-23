import { Mongo } from 'meteor/mongo';

export const Files = new Mongo.Collection('files');

// Schema:
//
// appId:  _id of app in MainIndex (not appId).
//
// sourceId: _id of source in Sources
//
// type: One of 'package', 'metadata' or 'image'
//
// path: path of file (both on remote and local).
//
// status: String
//
// errMsg: String - error message.  Is "" if no error.
//
export function setStatus(file, status, errmsg) {
  const myErrmsg = (errmsg ? errmsg : "");
  console.log(`setting status for ${file.path} to ${status}`)
  Files.update(
    {_id: file._id},
    {$set: {
      status: status,
      errmsg: myErrmsg,
      }
  });
}


if (Meteor.isServer) {
  Meteor.publish("files", function() {
    return Files.find();
  })
}

Meteor.methods({
  'files.create'(file) {
    return Files.insert(file);
  },

  'files.update'(fileId, updater) {
    Files.update(fileId, updater);
  },

  'files.delete'(fileId) {
    Files.remove(fileId);
  }
});
