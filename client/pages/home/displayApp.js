import { Template } from 'meteor/templating';

import { Files } from '/imports/api/files';
import { SandstormInfo } from '/imports/api/sandstorm';
import { Sources } from '/imports/api/sources';
import { MainIndex } from '/imports/api/mainIndex';

import './displayApp.html';

Template.DisplayApp.onCreated(function() {

});

Template.DisplayApp.helpers({
  app() {
    return currentApp();
  },

  files() {
    const app = currentApp();
    const files = Files.find({appId: app._id, sourceId: app.sourceId}).fetch();
    return files;
  },
});

Template.DisplayApp.events({
  'click button.js-fetch-app-files'(event) {
    event.stopPropagation();
    const appId = event.currentTarget.getAttribute('data-app-id');
    Meteor.call('mainIndex.fetch', appId);
  },
});

function currentApp() {
  return Template.currentData().app;
}
