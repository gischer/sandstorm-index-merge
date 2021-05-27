import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Import needed templates
import '/imports/ui/layouts/mainLayout';

// Set up all routes in the app
import '/client/pages/home/home.js';

FlowRouter.route('/', {
  name: 'Home',
  action() {
    this.render("MainLayout", 'Home');
  },
});


import '/client/pages/sources/sources.js';

FlowRouter.route('/sources', {
  name: "Sources",
  action() {
    this.render("MainLayout", "Sources");
  }
});

import '/client/pages/sources/show/show.js';

FlowRouter.route('/sources/:id', {
  name: "Show Source",
  action(params) {
    this.render("MainLayout", "ShowSource", params);
  }
})
