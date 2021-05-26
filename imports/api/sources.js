import { Mongo } from 'meteor/mongo';

import { getAccessToken, downloadAppIndex } from '/imports/lib/sandstorm';
import { SandstormInfo } from '/imports/api/sandstorm';

export const CanonicalSource = 'https://app-index.sandstorm.io/';
export const Sources = new Mongo.Collection('sources');

export const DownloadStates = [
  'Initializing',
  'Fetching',
  'Fetched',
  'Error',
]

// Schema for sources:
// name: String
//
// claimToken: String
//
// accessToken: String
//
// downloadStatus: String
//
// errorMessage: String
//
// apps: [AppSchema]
//
// NB:  Sources do not need their own url.
// The request is made with the canonical source,
//  then the sandstorm proxy maps the Auth (Bearer) token to the actual specified
// source.


if (Meteor.isServer) {
  Meteor.publish("sources", function() {
    return Sources.find();
  })
};

Meteor.methods({
  "sources.create"(claimtoken, name) {
    const id = Sources.insert({claimToken: claimtoken, name: name, downloadStatus: 'Initializing'});
    const source = Sources.findOne(id);
    const info = SandstormInfo.findOne();
    getAccessToken(source, info)
    .then((response) => {
      source.accessToken = response.data.cap;
      Sources.update(source._id, source);
      return (source);
    }).catch((error) => {
      Sources.update(id, {$set: {downloadStatus: 'Error', errorMessage: error.toString()}});
    }).then((source) => {
      Sources.update(id, {$set: {downloadStatus: 'Fetching', errorMessage: null}});
      downloadAppIndex(source)
      .then((result) => {
        source.apps = result.data.apps;
        Sources.update(id, {$set: {downloadStatus: 'Fetched', apps: result.data.apps, timestamp: new Date(Date.now()).toUTCString(), errorMessage: null}});
      })
      .catch((error) => {
        Sources.update(id, {$set: {downloadStatus: 'Error', errorMessage: error.toString()}});
      })
    });

/*    .then((source) => {
      //downloadAppIndex(source)
      console.log(`getAccessToken set source to ${source}`)
    }).catch((error) => {
      console.log(`Error downloading source index: ${error}`)
      Sources.update(id, {$set: {downloadError: error}});
    })
    */
  },

  "sources.update"(sourceId, updater) {
    return Sources.update(sourceId, updater);
  },

  "sources.delete"(sourceId) {
    return Sources.remove(sourceId);
  }
})
