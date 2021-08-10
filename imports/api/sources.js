import { Mongo } from 'meteor/mongo';

import { getAccessToken, downloadAppIndex, hostIsSandstorm } from '/imports/lib/sandstorm';
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
// claimToken: String (used only if host is Sandstorm)
//
// baseUrl: String (used only if host isn't Sandstorm)
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
  "sources.create"(name, args) {
    if (hostIsSandstorm()) {
      const id = Sources.insert({claimToken: args.claimToken, name: name, downloadStatus: 'Initializing'});
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
    } else {
      let url = args.baseUrl;
      if (!url.match(/\bhttp:\/\//)) {
        url = 'http://' + args.baseUrl;
      }
      const id = Sources.insert({name: name, baseUrl: url, downloadState: 'Initializing'});
      const source = Sources.findOne(id);
      downloadAppIndex(source)
      .then((result) => {
        source.apps = result.data.apps;
        Sources.update(id, {$set: {downloadStatus: 'Fetched', apps: result.data.apps, timestamp: new Date(Date.now()).toUTCString(), errorMessage: null}});
      })
      .catch((error) => {
        console.log(error);
        Sources.update(id, {$set: {downloadStatus: 'Error', errorMessage: error.toString()}});
      })
    }

  },

  "sources.update"(sourceId, updater) {
    return Sources.update(sourceId, updater);
  },

  "sources.delete"(sourceId) {
    return Sources.remove(sourceId);
  }
})
