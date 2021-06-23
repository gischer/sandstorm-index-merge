import FS from 'fs';
import { promises as FSP } from 'fs';

export function storeStreamTo(stream, filename) {
  if (Meteor.isServer) {
    return stream.pipe(FS.createWriteStream(filename));
  } else {
    console.log(`simulating storing stream to ${filename}`)
  }
  return false;
}

export function storeStringTo(string, filename) {
  if (Meteor.isServer) {
    FSP.open(filename, 'w')
    .then((filehandle) => {
      filehandle.write(string)
    })
  }
}

export function ensureDirectoryStructure(path) {
  if (Meteor.isServer) {
    return FSP.mkdir(path, {recursive: true});
  } else {
    console.log(`simulating recursive mkdir of ${path}`);
    return Promise.resolve(true);
  }
}
