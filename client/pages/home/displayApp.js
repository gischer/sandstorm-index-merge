import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { Files } from '/imports/api/files';
import { SandstormInfo } from '/imports/api/sandstorm';
import { Sources } from '/imports/api/sources';
import { MainIndex, crunchAppStatus } from '/imports/api/mainIndex';

import './displayApp.html';



Template.DisplayApp.onCreated(function() {
  this.showDetails = new ReactiveVar(false);
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

  appStatus() {
    const app = currentApp();
    return crunchAppStatus(app);
  },

  statusColor() {
    const app = currentApp();
    const status = crunchAppStatus(app);
    if (status === 'Ready') {
      return 'text-success';
    }
    if (status === 'Errors') {
      return 'text-danger'
    }
    if (status === 'In progress') {
      return 'text-muted';
    }
    return 'text-warning';
  },

  showingDetails() {
    return Template.instance().showDetails.get();
  },

  contingentError(file) {
    if (file.status === 'Error') {
      return file.errmsg;
    }
    return "";
  }
});

Template.DisplayApp.events({
  'click .js-fetch-app-files'(event) {
    event.stopPropagation();
    const appId = event.currentTarget.getAttribute('data-app-id');
    Meteor.call('mainIndex.fetch', appId);
  },

  'click .js-show-details'(event) {
    Template.instance().showDetails.set(true);
    event.stopPropagation();
  },

  'click .js-hide-details'(event) {
    Template.instance().showDetails.set(false);
    event.stopPropagation();
  },
});


function currentApp() {
  return Template.currentData().app;
}
