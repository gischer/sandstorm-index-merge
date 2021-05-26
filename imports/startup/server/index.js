// Import server startup through a single index entry point

import '/imports/startup/both/index';
import '/imports/api/mainIndex';
import '/imports/api/sandstorm';
import '/imports/api/sources';

import { exec } from 'child_process';

if (Meteor.isServer) {
  /*
  exec(`prlimit --nofile`, (error, stderr, stdout) => {
    console.log(`prlimit(0): ${stderr}`)
    exec('prlimit --nofile=8192', (error, stderr, stdout) => {
      if (error) {
        console.log(`prlimit Error: ${error}`);
      }
      if (stderr) {
        console.log(`prlimit stderr: ${error}`);
      }
      console.log(`prlimit: ${stdout}`)
    })
  })
  */
}
