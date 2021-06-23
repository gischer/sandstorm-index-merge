//import { HTTPS } from 'https';
import AXIOS from 'axios';
import { promises as FSP } from 'fs';
import { R } from 'meteor/ramda:ramda';

import { Config } from '/imports/startup/both/config';
import { Files, setStatus } from '/imports/api/files';
import { updateIndex, processMetadata } from '/imports/api/mainIndex';
import { CanonicalSource } from '/imports/api/sources';
import { storeStreamTo } from '/imports/lib/store';


var AppIndexInstance = null;

const urlRegex = /([a-z0-9]+):\/\/([a-z0-9\.]+):([\d]+)/;

export function createHttpInstance(source, sandstormInfo) {
  if (Meteor.isServer) {
    const proxyParsed = process.env.HTTP_PROXY.match(urlRegex)
    const axiosInstance = AXIOS.create({
      proxy: {
        protocol: proxyParsed[1],
        host: proxyParsed[2],
        port: Number(proxyParsed[3]),
      },
      baseURL: CanonicalSource,
      timeout: 5000,
      responseType: 'stream',
      headers: {
        'Authorization': `Bearer ${sandstormInfo.accessToken}`,
      }
    })
    return axiosInstance;
  } else {
    return {
      get(filename) {
        console.log(`simulate get ${filename}`);
        return Promise.resolve(true)
      }
    }
  }
};

export function readFileAsString(filename) {
  return FSP.readFile(filename)
}

export function fetchAndStorePackage(app) {
  const packageFile = Files.findOne({appId: app._id, sourceId: app.sourceId, type: 'package'})
  setStatus(packageFile, 'Fetching');
  return app.fetcher.get(packageFile.path).then((response) => {
    if (!response) {
      return false;;
    }
    setStatus(packageFile, 'Storing');
    storeStreamTo(response.data, Config.localFileRoot + packageFile.path)
    .on('finish', Meteor.bindEnvironment(() => {
      setStatus(packageFile, 'Fetched');
    }));
  })
  .catch((err) => {
    setStatus(packageFile, 'Error', err.toString());
  })
};

export function fetchAndStoreMetadata(app) {
  const metadataFile = Files.findOne({appId: app._id, sourceId: app.sourceId, type: 'metadata'});
  setStatus(metadataFile, 'Fetching');
  return app.fetcher.get(metadataFile.path).then((response) => {
    if (!response) {
      return false;
    }
    const filename = Config.localFileRoot + metadataFile.path;
    storeStreamTo(response.data, filename)
    .on('finish', Meteor.bindEnvironment(() => {
      setStatus(metadataFile, 'Fetched');
    }));
  })
  .catch((err) => {
    setStatus(metadataFile, 'Error', err.toString())
  })
};

export function fetchAndStoreImage(app, imageFile) {
  setStatus(imageFile, 'Fetching');
  return app.fetcher.get(imageFile.path).then((response) => {
    if (!response) return false;
    setStatus(imageFile, 'Storing');
    storeStreamTo(response.data, Config.localFileRoot + imageFile.path)
    .on('finish', Meteor.bindEnvironment(() => {
      setStatus(imageFile, 'Fetched');
    }));
  })
  .catch((err) => {
    setStatus(imageFile, 'Error', err.toString())
  })
};

export function fetchAndStoreImages(app) {
  processMetadata(app)
  .then((metadata) => {
    const files = Files.find({appId: app._id, sourceId: app.sourceId, type: 'image'}).fetch();

    function getScreenshot(promise, file) {
      return new Promise((resolve, reject) => {
        promise.then((result) => {
          setStatus(file, 'Fetching')
          return app.fetcher.get(file.path);
        }).then((response) => {
          setStatus(file, 'Storing');
          storeStreamTo(response.data, Config.localFileRoot + file.path)
          .on('finish', Meteor.bindEnvironment(() => {
            setStatus(file, 'Fetched');
            resolve(true);
          }))
        })
        .catch((err) => {
          setStatus(file, 'Error', err.toString());
        })
      })
    }
    R.reduce(getScreenshot, Promise.resolve(true), files);
  });
};

export function fetchAllParts(app, source, sandstormInfo) {
  app.fetcher = createHttpInstance(source, sandstormInfo)
  console.log(`fetching package for ${app.name}`)
  fetchAndStorePackage(app)
  .then(() => {
    console.log(`fetching metadata for ${app.name}`)
    return fetchAndStoreMetadata(app)
  })
  .then(() => {
    console.log(`fetching images for ${app.name}`)
    return fetchAndStoreImages(app);
  })
  .then(() => {
    updateIndex(app);
  })
}
