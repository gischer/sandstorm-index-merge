import { Mongo } from 'meteor/mongo';

export const MainIndex = new Mongo.Collection('index');

// Schema
//
// appId: String
//
// name: String
//
// version: String
//
// packageId: String
//
// imageId: String
//
// webLink: String
//
// codeLink: String
//
// isOpenSource: Boolean
//
// categories: [String]
//
// author: {
//   name: String
//   keybaseUserName: String
//   picture: String
//   githubUserName: String
//   twitterUserName: String
// }
//
// shortDesription: String
//
// upstreamAuthor: String
//
// createdAt: String
//
// versionNumber: Number
//
// ADDED BY CONFLUENCE
//
// uploadStatus: [{type: String, status: String, id: String, errmsg: String}]
//
// source: String

if (Meteor.isServer) {
  Meteor.publish("mainIndex", function() {
    return MainIndex.find();
  })
}

Meteor.methods({
  "mainIndex.create"(app) {
    return MainIndex.insert(app);
  },

  "mainIndex.update"(id, updater) {
    // id here is app._id, not app.appId
    return MainIndex.update(id, updater);
  },

  "mainIndex.delete"(id) {
    // id here is app._id, not app.appId
    return MainIndex.remove(appId);
  }
})
