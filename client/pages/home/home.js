import { Template } from 'meteor/templating';

import './home.html';

Template.Home.onCreated(function() {
  Meteor.call('sandstorm.initialize');
})
