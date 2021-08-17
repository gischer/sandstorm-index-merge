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
    return (app.included ? 'checked' : '');
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
    const app = R.find(R.propEq('appId', appId), source.apps);
    if (app && app.include) {
      app.sourceId = source._id;
      Meteor.call('mainIndex.create', app);
    } else if (app && !app.include) {
      Meteor.call('mainIndex.delete', app.appId, source._id);
    }
  }
})

function getSource() {
  return Sources.findOne(Template.currentData().id);
}
