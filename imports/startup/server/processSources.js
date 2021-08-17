import { R } from 'meteor/ramda:ramda';

import { MainIndex } from '/imports/api/mainIndex';
import { Sources } from '/imports/api/sources';
import { downloadSource } from '/imports/lib/standalone';
import { fetchAllParts } from '/imports/lib/fetch';

export function processSources(manifest) {
  Sources.remove({});
  MainIndex.remove({});

  const downloadPromises = R.map(downloadSource, manifest.sources);
  Promise.all(downloadPromises)
  .then(() => {

    function show(app) {
      console.log(`included ${app.name}`);
    }
    const apps = MainIndex.find({}).fetch();
    R.map(show, apps);

    function fetchApp(app) {
      const source = Sources.findOne(app.sourceId);
      fetchAllParts(app, source);
    }
    R.map(fetchApp, apps);
  })
}
