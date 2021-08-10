import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { AppIndexRpcId, AppIndexDescriptor, hostIsSandstorm } from '/imports/lib/sandstorm';
import { Sources } from '/imports/api/sources';

import './sources.html';

import '/imports/ui/components/navbar';

Template.Sources.onCreated(function() {
  this.newSourceErrorMessage = new ReactiveVar("");
  this.subscribe('sources');
});

Template.Sources.helpers({
  newSourceHasError() {
    return Template.instance().newSourceErrorMessage.get() != "";
  },

  newSourceErrorMessage() {
    return Template.instance().newSourceErrorMessage.get();
  },

  sources() {
    return Sources.find().fetch();
  },

  status(source) {
    if (source.status === 'Error') {
      return `<a class='js-show-error-link' data-source-id=${source._id}>Error</a>`;
    } else {
      return source.status;
    }
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
    if (hostIsSandstorm()) {
      collectClaimToken();
    } else {
      const name = document.getElementById("new-source-name").value;
      const url = document.getElementById('new-source-base-url').value;
      Meteor.call("sources.create", name, {baseUrl: url});
    }
  },

  "click a.js-show-error-link"(event) {
    const id = event.currentTarget.getAttribute('data-source-id');
    const source = Sources.findOne(id);
    alert(`${source.name} encountered an error while fetching: ${source.errorMessage}`)
  }
})

function collectClaimToken() {
  const name = document.getElementById("new-source-name").value;
  if (typeof name === 'undefined' || name.length == 0) {
    Template.instance().newSourceErrorMessage.set("A new source must be given a name that allows you to identify it");
    return;
  } else {
    Template.instance().newSourceErrorMessage.set("");
  }

  function handlePowerboxMessage(event) {
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
    Meteor.call("sources.create", name, {token: response.token});
    window.removeEventListener("message", handlePowerboxMessage);
  }

  window.addEventListener("message", handlePowerboxMessage);

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
