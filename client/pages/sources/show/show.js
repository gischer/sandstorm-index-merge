import { Template } from 'meteor/templating';
import { R } from 'meteor/ramda:ramda';

import { Sources } from '/imports/api/sources';

import './show.html';

Template.ShowSource.onCreated(function() {
  this.subscribe('sources');
});

Template.ShowSource.helpers({
  source() {
    const source = getSource();
    if (!!source) {
      return source;
    }
    return {name: "Fake Source Name"}
  },

  sources() {
    return Sources.find().fetch();
  },

  isIncluded(app) {
    return (app.include ? 'checked' : '');
  },
});

Template.ShowSource.events({
  "click .js-include-app-checkbox"(event) {
    const state = event.currentTarget.checked;
    const appId = event.currentTarget.getAttribute('data-app-id');
    const source = getSource();
    function setInclusion(app) {
      if (app.appId === appId) {
        app.include = state;
      }
      return app;
    }
    source.apps = R.map(setInclusion, source.apps);
    Meteor.call("sources.update", source._id, source);
  }
})

function getSource() {
  return Sources.findOne(Template.currentData().id);
}
