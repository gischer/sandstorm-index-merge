//import { HTTPS } from 'https';
import AXIOS from 'axios';
import { promises as FSP } from 'fs';
import { R } from 'meteor/ramda:ramda';

import { Config } from '/imports/startup/both/config';
import { Files, setStatus, setBytes } from '/imports/api/files';
import { updateIndex, processMetadata } from '/imports/api/mainIndex';
import { CanonicalSource } from '/imports/api/sources';
import { storeStreamTo, storeBufferTo } from '/imports/lib/store';
import { hostIsSandstorm } from '/imports/lib/sandstorm';

var AppIndexInstance = null;

const urlRegex = /([a-z0-9]+):\/\/([a-z0-9\.]+):([\d]+)/;

export function createHttpInstance(source, sandstormInfo) {
  if (Meteor.isServer && hostIsSandstorm()) {
    const proxyParsed = process.env.HTTP_PROXY.match(urlRegex)
    const axiosInstance = AXIOS.create({
      proxy: {
        protocol: proxyParsed[1],
        host: proxyParsed[2],
        port: Number(proxyParsed[3]),
      },
      baseURL: CanonicalSource,
      timeout: 0,
      responseType: 'stream',
      headers: {
        'Authorization': `Bearer ${source.accessToken}`,
      }
    })
    return axiosInstance;
  } else if (Meteor.isServer) {
    const axiosInstance = AXIOS.create({
      baseURL: source.baseUrl,
      timeout: 0,
      responseType: 'stream',
    })
    return axiosInstance;
  } else {
    return {
      get(filename) {
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
  return new Promise((resolve, reject) => {
    app.fetcher.get(packageFile.path)
    .then((response) => {
      if (!response) {
        const message = `Package fetch had no response`
        console.log(message);
        reject(new Error(message));
      }
      if (app.fetcher.defaults.responseType === 'stream') {
        setStatus(packageFile, 'Storing');
        setBytes(packageFile, 0);

        response.data.on('data', Meteor.bindEnvironment((data) => {
 //          setBytes(packageFile, packageFile.bytesUploaded + data.length);
//           console.log('>>>>>PROGRESS<<<<<<<')
//           console.log(data.length);
        }));

        storeStreamTo(response.data, Config.localFileRoot + packageFile.path)
        .on('finish', Meteor.bindEnvironment(() => {
          setStatus(packageFile, 'Fetched');
          resolve(true);
        }))
        .on('error', Meteor.bindEnvironment((error) => {
          const message = `Error storing package: ${error}`
          setStatus(packageFile, 'Error', error );
          console.log(message);
          reject(new Error(message))
        }))
      } else {
        setStatus(packageFile, 'Storing');
        storeBufferTo(response.data, Config.localFileRoot + packageFile.path)
        .then(() => {
          setStatus(packageFile, 'Fetched');
          resolve(true);
        });
      }
    })
    .catch((err) => {
      const message = `Error fetching package: ${err}`;
      console.log(message)
      setStatus(packageFile, 'Error', err.toString());
      reject(new Error(message));
    })
  })
};

export function fetchAndStoreMetadata(app) {
  const metadataFile = Files.findOne({appId: app._id, sourceId: app.sourceId, type: 'metadata'});
  setStatus(metadataFile, 'Fetching');
  return new Promise((resolve, reject) => {
    app.fetcher.get(metadataFile.path).then((response) => {
      if (!response) {
        const message = `Package fetch had no response`;
        console.log(message);
        reject(new Error(message));
      }
      if (app.fetcher.defaults.responseType === 'stream') {
        const filename = Config.localFileRoot + metadataFile.path;
        storeStreamTo(response.data, filename)
          .on('finish', Meteor.bindEnvironment(() => {
            setStatus(metadataFile, 'Fetched');
            resolve(true);
          }))
          .on('error', Meteor.bindEnvironment((error) => {
            const message = `Error storing metadata: ${error}`;
            console.log(message);
            reject(new Error(message))
          }));
      } else {
        setStatus(metadataFile, 'Storing');
        storeBufferTo(JSON.stringify(response.data), Config.localFileRoot + metadataFile.path)
        .then(() => {
          setStatus(metadataFile, 'Fetched');
          resolve(true);
        });
      }
    })
    .catch((err) => {
      setStatus(metadataFile, 'Error', err.toString())
      const message = `Error fetching metadata: ${err}`;
      reject(new Error(message));
    })
  })
};

export function fetchAndStoreImage(app, imageFile) {
  setStatus(imageFile, 'Fetching');
  return new Promise((resolve, reject) => {
    app.fetcher.get(imageFile.path).then((response) => {
      if (!response) {
        const message = `Image fetch had no response`;
        console.log(message);
        reject(new Error(message));
      }
      setStatus(imageFile, 'Storing');
      if (app.fetcher.defaults.responseType === 'stream') {
        storeStreamTo(response.data, Config.localFileRoot + imageFile.path)
        .on('finish', Meteor.bindEnvironment(() => {
          setStatus(imageFile, 'Fetched');
          resolve(true);
        }))
        .on('error', Meteor.bindEnvironment((error) => {
          const message = `Error storing image: ${error}`;
          console.log(message);
          setStatus(imageFile, 'Error', error);
          reject(new Error(message));
        }));
      } else {
        storeBufferTo(response.data, Config.localFileRoot + imageFile.path)
        .then(() => {
          setStatus(imageFile, 'Fetched');
          resolve(true);
        });
      }
    })
    .catch((err) => {
      setStatus(imageFile, 'Error', err.toString())
      const message = `Error fetching image: ${err}`;
      console.log(message);
      reject(new Error(message));
    })
  })
};

export function fetchAndStoreImages(app) {
  return new Promise((resolve, reject) => {
    processMetadata(app)
    .then((metadata) => {
      const files = Files.find({appId: app._id, sourceId: app.sourceId, type: 'image'}).fetch();

      function getScreenshot(promise, file) {
        console.log(`fetching ${file}`)
        return new Promise((resolve, reject) => {
          promise.then((result) => {
            setStatus(file, 'Fetching')
            return app.fetcher.get(file.path);
          }).then((response) => {

            setStatus(file, 'Storing');
            if (app.fetcher.defaults.responseType === 'stream') {
              storeStreamTo(response.data, Config.localFileRoot + file.path)
              .on('finish', Meteor.bindEnvironment(() => {
                setStatus(file, 'Fetched');
                resolve(true);
              }))
            } else {
              storeBufferTo(response.data, Config.localFileRoot + file.path)
              .then(() => {
                setStatus(file, 'Fetched');
                resolve(true);
              });
            }
          })
          .catch((err) => {
            setStatus(file, 'Error', err.toString());
          })
        })
      }
      const result = R.reduce(getScreenshot, Promise.resolve(true), files);
      result.then(() => {
        resolve(true);
      });
    });
  })
};

export function fetchAllParts(app, source, sandstormInfo) {
  app.fetcher = createHttpInstance(source, sandstormInfo);
  fetchAndStorePackage(app).then(() => {
    fetchAndStoreMetadata(app)
    .then(() => {
      fetchAndStoreImages(app)
      .then(() => {
        updateIndex(app);
      })
    })
  })
  .catch((err) => {
    console.log(err);
  })

}
