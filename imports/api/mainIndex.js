import { Mongo } from 'meteor/mongo';

import { Config } from '/imports/startup/both/config';

import { Files } from '/imports/api/files';
import { SandstormInfo } from '/imports/api/sandstorm';
import { Sources } from '/imports/api/sources';
import { fetchAllParts, readFileAsString } from '/imports/lib/fetch';
import { ensureDirectoryStructure, storeStringTo } from '/imports/lib/store';


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
// uploads: [{type: String, status: String, id: String, errmsg: String}]
//
// sourceId: String


export function processMetadata(app) {
  if (Meteor.isServer) {
    const metadataFile = Files.findOne({appId: app._id, sourceId: app.sourceId, type: 'metadata'});
    if (!metadataFile) {
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      readFileAsString(Config.localFileRoot + metadataFile.path)
      .then((string) => {
        const metadata = JSON.parse(string);
        function addScreenshot(screenshot) {
          Files.insert({appId: app._id, sourceId: app.sourceId, type: 'image', path: `/images/${screenshot.imageId}`, status: "Absent", errmsg: ""});
        }
        R.map(addScreenshot, metadata.screenshots);
        resolve(true);
      }).catch((err) => {
        // Ignore errors here, we just don't get the screenshots?
      })
    })
  } else {
    return Promise.resolve(true);
  }
}

export function updateIndex(app) {
  function checkApp(goodApps, app) {
    // Verify that all files have been successfully fetched
    const files = Files.find({appId: app._id, sourceId: app.sourceId}).fetch();
    const problems = R.reject(R.propEq('status', 'Fetched'), files);
    if (problems.length == 0) {
      return R.append(app, goodApps);
    } else {
      return goodApps;
    }
  }
  const allApps = MainIndex.find().fetch();
  const includedApps = R.reduce(checkApp, [], allApps);
  const string = JSON.stringify(includedApps);
  ensureDirectoryStructure(Config.localFileRoot + '/apps/')
  .then(() => {
    storeStringTo(string, Config.localFileRoot + '/apps/index.json');
  })
}

if (Meteor.isServer) {
  Meteor.publish("mainIndex", function() {
    return MainIndex.find();
  })
}

Meteor.methods({
  "mainIndex.create"(app) {
    // app is assumed to have source already set.
    const appId = MainIndex.insert(app);

    const files = [
      {appId: appId, sourceId: app.sourceId, type: 'package', path: `/packages/${app.packageId}`, status: 'Absent', errmsg: ""},
      {appId: appId, sourceId: app.sourceId, type: 'metadata', path: `/apps/${app.appId}.json`, status: 'Absent', errmsg: ""},
    ];

    if (app.imageId) {
      files.push(
        {appId: appId, sourceId: app.sourceId, type: 'image', path: `/images/${app.imageId}`, status: 'Absent', errmsg: ""},
      )
    };

    function insertFile(file) {
      Files.insert(file);
    }
    // We will need to put screenshots on this list once we fetch metadata.
    R.map(insertFile, files);
    return appId;
  },

  "mainIndex.update"(id, updater) {
    // id here is app._id, not app.appId
    return MainIndex.update(id, updater);
  },

  "mainIndex.delete"(appId, sourceId) {
    // appId here is app.appId, not app._id
    return MainIndex.remove({appId: appId, sourceId: sourceId});
  },

  "mainIndex.fetch"(id) {
    const app = MainIndex.findOne(id);
    const source = Sources.findOne(app.sourceId);
    const sandstormInfo = SandstormInfo.findOne();
    fetchAllParts(app, source, sandstormInfo);
  }
})
