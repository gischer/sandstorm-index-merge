import { Template } from 'meteor/templating';

import "./navbar.html";

Template.Navbar.onCreated(function() {

});

Template.Navbar.helpers({
  sources() {
    return Template.currentData().sources;
  },
});

Template.Navbar.events({

});
