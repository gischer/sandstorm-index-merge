import { Template } from 'meteor/templating';

import { SandstormInfo } from '/imports/api/sandstorm';
import { Sources } from '/imports/api/sources';

import './home.html';

import '/imports/ui/components/navbar';

Template.Home.onCreated(function() {
  Meteor.call('sandstorm.initialize');
  this.subscribe('sandstorm.info');
  this.subscribe('sources');
})

Template.Home.helpers({
  indexUrl() {
    const info = SandstormInfo.findOne();
    return (typeof info == 'undefined') ? "???" : info.publicIdPath;
  },

  sources() {
    return Sources.find().fetch();
  }
})
