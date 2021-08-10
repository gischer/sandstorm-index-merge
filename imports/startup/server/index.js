// Import server startup through a single index entry point

import '/imports/startup/both/index';
import '/imports/api/mainIndex';
import '/imports/api/sandstorm';
import '/imports/api/sources';

import { exec } from 'child_process';
import { R } from 'meteor/ramda:ramda';
import { Config } from '/imports/startup/both/config';
import { hostIsSandstorm } from '/imports/lib/sandstorm';

if (Meteor.isServer) {
  import { ensureDirectoryStructure } from '/imports/lib/store';

  ensureDirectoryStructure(Config.localFileRoot + '/apps');
  ensureDirectoryStructure(Config.localFileRoot + '/packages');
  ensureDirectoryStructure(Config.localFileRoot + '/images');

  if (!hostIsSandstorm()) {
    import { processSources } from './processSources';
    import { Manifest } from './manifest';

    processSources(Manifest);
  }
}
