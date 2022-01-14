import { Template } from 'meteor/templating';

import { Files } from '/imports/api/files';
import { SandstormInfo } from '/imports/api/sandstorm';
import { Sources } from '/imports/api/sources';
import { MainIndex } from '/imports/api/mainIndex';

import { hostIsSandstorm } from '/imports/lib/sandstorm';

import './home.html';
import './displayApp';

import '/imports/ui/components/navbar';

Template.Home.onCreated(function() {
  if (hostIsSandstorm()) {
    Meteor.call('sandstorm.initialize');
  }
  this.autorun(() => {
    if (hostIsSandstorm()) {
      this.subscribe('sandstorm.info');
    }
    this.subscribe('sources');
    this.subscribe('mainIndex');
    this.subscribe('files');
  })
})

Template.Home.helpers({
  indexUrl() {
    const info = SandstormInfo.findOne();
    return (typeof info == 'undefined') ? "???" : info.publicIdPath;
  },

  sources() {
    return Sources.find().fetch();
  },

  hasNoSources() {
    const count = Sources.find().count();
    return count == 0;
  },

  apps() {
    if (Template.instance().subscriptionsReady()) {
      return MainIndex.find().fetch();
    } else {
      return [];
    }
  },

  filesOf(app) {
    if (Template.instance().subscriptionsReady()){
      const files = Files.find({appId: app._id, sourceId: app.sourceId}).fetch();
      return files
    } else {
      return [];
    }
  }
})

Template.Home.events({
  'click .js-update-index'(event) {
    Meteor.call('mainIndex.updateAll')
  },

  'click .js-fetch-all-index'(event) {
    Meteor.call('mainIndex.fetchAll');
  },

  'click .js-check-for-updates'(event) {
    const updateList = Meteor.call('sources.checkForUpdates');
  }
});
