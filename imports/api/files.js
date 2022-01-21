import { Mongo } from 'meteor/mongo';
import { FS } from 'fs';

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
  Files.update(
    {_id: file._id},
    {$set: {
      status: status,
      errmsg: myErrmsg,
      }
  });
}

export function setBytes(file, bytes) {
  Files.update({_id: file._id},
  {$set: { bytesUploaded: bytes}})
}

export function deleteOldFiles(app) {
  console.log(`Deleting old files for ${app.name}, version ${app.versionNumber}`);
  const files = Files.find({appId: app.appId, appVersionNumber: app.versionNumber}).fetch();
  function processFile(file) {
    console.log(`Processing file ${file.path} of type ${file.type}`)
    if (file.type == 'package') {
      console.log(`Unlinking ${file.path} of type ${file.type}`)
      FS.unlink(file.path, (err) => {console.log(err)});
    }
    console.log(`Removing ${file.path} of type ${file.type}`)
    Files.remove(file._id);
  }
  R.map(processFile, files);
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
