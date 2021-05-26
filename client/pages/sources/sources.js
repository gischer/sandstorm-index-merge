import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { AppIndexRpcId, AppIndexDescriptor } from '/imports/lib/sandstorm';
import { Sources } from '/imports/api/sources';
import './sources.html';

Template.Sources.onCreated(function() {
  this.newSourceErrorMessage = new ReactiveVar("");
  this.subscribe('sources');
});

Template.Sources.helpers({
  newSourceHasError() {
    return this.newSourceErrorMessage.get() != "";
  },

  newSourceErrorMessage() {
    return this.newSourceErrorMessage.get();
  },

  sources() {
    return Sources.find().fetch();
  },

  timeOf(source) {
    if (!!source.timestamp) {
      return source.timestamp;
    }
    return "Never";
  }
});

Template.Sources.events({
  "click button#add-new-source"(event) {
    event.stopPropagation();
    event.preventDefault();
    console.log('add-new-source clicked');
    collectClaimToken();
  }
})

function collectClaimToken() {
  const name = document.getElementById("new-source-name").value;

  if (typeof name === 'undefined' || name.length == 0) {
    Template.instance().newSourceErrorMessage.set("A new source must be given a name that allows you to identify it");
  } else {
    Template.instance().newSourceErrorMessage.set("");
  }

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) {
      return;
    }

    const response = event.data;
    if (response.rpcId !== AppIndexRpcId) {
      return;
    }

    if (response.error) {
      console.log(error);
      return;
    }
    console.log(response)
    console.log(`calling sources.create with ${response.token}`);
    const accessToken = Meteor.call("sources.create", response.token, name);
    console.log(`accessToken is ${accessToken}`);
  });

  window.parent.postMessage({
    powerboxRequest: {
      rpcId: AppIndexRpcId,
      query: [
        AppIndexDescriptor
      ],
      saveLabel: {defaultText: "source application index"},
    }
  }, "*")
}
