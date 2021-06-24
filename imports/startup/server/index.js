// Import server startup through a single index entry point

import '/imports/startup/both/index';
import '/imports/api/mainIndex';
import '/imports/api/sandstorm';
import '/imports/api/sources';

import { exec } from 'child_process';
import { Config } from '/imports/startup/both/config';

if (Meteor.isServer) {
  import { ensureDirectoryStructure } from '/imports/lib/store';

  ensureDirectoryStructure(Config.localFileRoot + '/apps');
  ensureDirectoryStructure(Config.localFileRoot + '/packages');
  ensureDirectoryStructure(Config.localFileRoot + '/images');

}
