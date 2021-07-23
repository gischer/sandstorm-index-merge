import { Template } from 'meteor/templating';

import { Files } from '/imports/api/files';
import { SandstormInfo } from '/imports/api/sandstorm';
import { Sources } from '/imports/api/sources';
import { MainIndex } from '/imports/api/mainIndex';

import './home.html';
import './displayApp';

import '/imports/ui/components/navbar';

Template.Home.onCreated(function() {
  Meteor.call('sandstorm.initialize');
  this.autorun(() => {
    this.subscribe('sandstorm.info');
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
      console.log(`looking for files with appId ${app._id}, sourceId ${app.sourceId}`)
      const files = Files.find({appId: app._id, sourceId: app.sourceId}).fetch();
      console.log(files)
      return files
    } else {
      console.log('subscriptions not ready')
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
  }
});
