import { Mongo } from 'meteor/mongo';

import { getAccessToken, downloadAppIndex, hostIsSandstorm } from '/imports/lib/sandstorm';
import { MainIndex, fetchUpdate, crunchAppStatus } from '/imports/api/mainIndex';
import { SandstormInfo } from '/imports/api/sandstorm';
import { Manifest } from '/imports/startup/server/manifest';

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

function concatenatedApps(manifest) {
  function catenateReducer(accum, source) {
    return R.concat(accum, source.apps)
  }
  return R.reduce(catenateReducer, [], manifest.sources)
}

function includedInManifest(app) {
  return R.find(R.propEq('name', app.name), concatenatedApps(Manifest));
}

function needsUpdate(app) {
  const storedApp = MainIndex.findOne({appId: app.appId, versionNumber: app.versionNumber});
  if (!storedApp) return true;
  const status = crunchAppStatus(storedApp);
  if (status == 'Needs update') return true;
  if (status == 'In progress') return false;
  if (status == 'Errors') return true;
  if (status == 'Ready') return false;
  // This should never happen, but in case it does, we do nothing.
  return false;
}

function downloadAndProcessSource(appsToUpdate, source) {
  return new Promise((resolve, reject) => {
    downloadAppIndex(source)
    .then((response) => {
      const requestedList = R.filter(includedInManifest, response.data.apps)
      const filteredList = R.filter(needsUpdate, requestedList);
      const staleApps = R.concat(appsToUpdate, filteredList);
      function addSource(app) {
        app.sourceId = source._id;
        return app;
      }
      R.map(addSource, staleApps);
      resolve(staleApps)
    })
    .catch((error) => {
      reject(error);
    });
  })
}

export function checkForUpdates() {
  if (Meteor.isServer) {
    var applist = [];
    const sources = Sources.find().fetch();
    function checkReducer(promise, source) {
      return promise.then((list) => {
        return downloadAndProcessSource(list, source)
      })
    }

    R.reduce(checkReducer, Promise.resolve([]), sources)
    .then((apps) => {
      function reportUpdate(app) {
        console.log(`Will update ${app.name}`)
        console.log(`from ${app.source.baseUrl}`);
      }
      if (apps.length > 0) {
        console.log("Updates found:")
        R.map(reportUpdate, apps);
      } else {
        console.log('No updates found')
      }
      function updateReducer(promise, app) {
        return promise.then(() => {
          return fetchUpdate(app);
        })
      }

      R.reduce(updateReducer, Promise.resolve(true), apps);
    })
  }
}

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
  },

  "sources.checkForUpdates"() {
    console.log('Checking for updates now');
    checkForUpdates();
    return checkForUpdates();
  }
})
