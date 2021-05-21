
import { headers } from 'meteor/gadicohen:headers';

export function getSandstormInfo(context) {
  if (Meteor.isServer) {
    const sandstormInfo = {};
    sandstormInfo.basePath = headers.get(context, 'x-sandstorm-base-path');
    sandstormInfo.grainName = sandstormInfo.basePath.split('//')[1].split('.')[0];
    sandstormInfo.sessionId = headers.get(context, 'x-sandstorm-session-id');
    sandstormInfo.host = headers.get(context, 'host');
    return sandstormInfo;
  } else {
    return {};
  }
}

import { execFileSync } from 'child_process';
const COMMAND = '/opt/app/getPublicId';
export function getPublicId(sessionId) {
  if (Meteor.isServer) {
    const stdout = execFileSync(COMMAND, [sessionId]).toString();
    console.log(stdout);
    return stdout;
  } else {
    return "";
  }
}
