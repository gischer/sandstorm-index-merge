
import { Config } from '/imports/startup/both/config';
import { checkForUpdates } from '/imports/api/sources';

var TimerId = -1;

export function scheduleUpdateCheck() {
  if (TimerId != -1) {
    clearInterval(TimerId);
    TimerId = -1;
  }
  function cfuWrapper() {
    console.log(`Checking for updates, will check again in ${Config.updateCheckInterval/1000} seconds`)
    checkForUpdates();
  }
  TimerId = setInterval(
    Meteor.bindEnvironment(cfuWrapper),
    Config.updateCheckInterval
  )
};
