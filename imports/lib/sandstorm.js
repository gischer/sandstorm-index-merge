
import { headers } from 'meteor/gadicohen:headers';

import { Sources, CanonicalSource } from '/imports/api/sources';
import { SandstormInfo } from '/imports/api/sandstorm';

export const AppIndexDescriptor = "EA1QAQEAABEBF1EEAQH/x80lxnnjecgAQAMRCfoAAf9odHRwczovLwJhcHAtaW5kZXguc2FuZHN0P29ybS5pbw=="
export const AppIndexRpcId = 1;

export function getSandstormInfo(context) {
  if (Meteor.isServer) {
    const sandstormInfo = {};
    sandstormInfo.basePath = headers.get(context, 'x-sandstorm-base-path');
    sandstormInfo.grainName = sandstormInfo.basePath.split('//')[1].split('.')[0];
    sandstormInfo.sessionId = headers.get(context, 'x-sandstorm-session-id');
    sandstormInfo.host = headers.get(context, 'host');
    console.log(`Session Id is ${sandstormInfo.sessionId}`)
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

const urlRegex = /([a-z0-9]+):\/\/([a-z0-9\.]+):([\d]+)/;

export function getAccessToken(source, info) {
  if (Meteor.isServer) {
    import AXIOS from 'axios';
    console.log(`making claim request with ${source.claimToken}`)
    const proxyParsed = process.env.HTTP_PROXY.match(urlRegex)
    return AXIOS({
        proxy: {
          protocol: proxyParsed[1],
          host: proxyParsed[2],
          port: Number(proxyParsed[3]),
        },
        method: 'POST',
        url: `http://http-bridge/session/${info.sessionId}/claim`,
        data: {
          "requestToken": source.claimToken,
          "requiredPermissions": [],
        }
    });
  } else {
    return Promise.resolve(true);
  }
}

export function downloadAppIndex(source) {
  console.log(`Download app index`)
  if (Meteor.isServer) {
    import AXIOS from 'axios';
    const proxyParsed = process.env.HTTP_PROXY.match(urlRegex)
    return AXIOS.get('/apps/index.json', {
      proxy: {
        protocol: proxyParsed[1],
        host: proxyParsed[2],
        port: Number(proxyParsed[3]),
      },
      baseURL: CanonicalSource,
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${source.accessToken}`,
      }
    })
  } else {
    return Promise.resolve(true);
  }

}
