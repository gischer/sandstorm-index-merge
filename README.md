# Sandstorm Index Merge
A Sandstorm app-index aggregator

This app will selectively download sandstorm apps from multiple sources, each of which
implements the Sandstorm app-index api.  Those apps will be combined into a single app-index.  It also reports status, in case there is any trouble with all the downloads.

This was built to be a Sandstorm app, so that login and permissions would be handled
by Sandstorm, as well as static file serving.  That thrust of the project ran into
a problem (Issue [#3546](https://github.com/sandstorm-io/sandstorm/issues/3546) that I
am unable to work around for now.

Thus there is a branch here called `standalone` where I have reorganized the outer
layers to accomodate running this on a server.

To use this, you will need to alter the file `/imports/startup/server/manifest.js` to
describe which source app-indexes you want to use, and which apps from each of them is
to be included.

You will also need to specify the url which you intend to serve the merged index from by
setting, in the file `/imports/startup/both/config.js`, the field `standaloneUrl` to have the full url of your server, e.g.,

```
standaloneUrl = "https://my-app-index.mydomain.io",
```

UI controls should be deactivated in standalone mode, and are present only for informational and compatibility reasons.
