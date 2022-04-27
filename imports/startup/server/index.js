// Import server startup through a single index entry point

import '/imports/startup/both/index';
import '/imports/api/mainIndex';
import '/imports/api/sandstorm';
import '/imports/api/sources';

import { exec } from 'child_process';
import { R } from 'meteor/ramda:ramda';
import { Config } from '/imports/startup/both/config';
import { fixPaths } from '/imports/api/files';
import { hostIsSandstorm } from '/imports/lib/sandstorm';
import { scheduleUpdateCheck } from '/imports/lib/timer';

if (Meteor.isServer) {
  import { ensureDirectoryStructure } from '/imports/lib/store';

  ensureDirectoryStructure(Config.localFileRoot + '/apps');
  ensureDirectoryStructure(Config.localFileRoot + '/packages');
  ensureDirectoryStructure(Config.localFileRoot + '/images');

  fixPaths()

  if (!hostIsSandstorm() && !Config.disableManifest) {
    import { processSources } from './processSources';
    import { Manifest } from './manifest';

    processSources(Manifest);
    scheduleUpdateCheck();
  } else {
    scheduleUpdateCheck();
  }
}
