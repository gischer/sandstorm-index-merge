import { R } from 'meteor/ramda:ramda';

import { downloadAppIndex } from '/imports/lib/sandstorm';
import { Sources } from '/imports/api/sources';

export function processSources(manifest) {
  Sources.remove({});

  function processSource(sourceRef) {
    const id = Sources.insert({name: sourceRef.name, baseUrl: sourceRef.baseUrl, status: 'Initializing'});
    const source = Sources.findOne(id);
    downloadAppIndex(source)
    .then((result) => {
      source.apps = result.data.apps;
      Sources.update(id, {$set: {downloadStatus: 'Fetched', apps: result.data.apps, timestamp: new Date(Date.now()).toUTCString(), errorMessage: null}});
    })
    .catch((error) => {
      Sources.update(id, {$set: {downloadStatus: 'Error', errorMessage: error.toString()}});
    })
    function processApp(app) {
      console.log(`download ${app.name} from ${source.baseUrl}`)
    }
    R.map(processApp, sourceRef.apps)
  }
  R.map(processSource, manifest.sources);
}
