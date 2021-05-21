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
