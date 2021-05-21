import { Template } from 'meteor/templating';

import { SandstormInfo } from '/imports/api/sandstorm';
import './home.html';

Template.Home.onCreated(function() {
  Meteor.call('sandstorm.initialize');
  this.subscribe('sandstorm.info');
})

Template.Home.helpers({
  indexUrl() {
    const info = SandstormInfo.findOne();
    return (typeof info == 'undefined') ? "???" : info.publicIdPath;
  }
})
