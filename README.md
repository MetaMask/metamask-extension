# Metamask Plugin

## Development

```bash
npm install
```
### Developing with Gulp

We're using an experimental version of `gulp-cli`, so if you have the old version of gulp, you'll need to uninstall it, `npm uninstall -g gulp`, and install this one instead:

```bash
npm install gulpjs/gulp-cli#4.0 -g
```

After that, you can just:
```bash
gulp dev
```

### In Chrome

Open `Settings` > `Extensions`.

Check "Developer mode".

At the top, click `Load Unpacked Extension`.

Navigate to your `metamask-plugin/dist` folder.

Click `Select`.

You now have the plugin, and can click 'inspect views: background plugin' to view its dev console.

### Developing the UI

To enjoy the live-reloading that `gulp dev` offers while working on the `metamask-ui` or `web3-provider-engine` dependencies:

 1. Clone the dependency locally.
 2. `npm install` in its folder.
 3. Run `npm link` in its folder.
 4. Run `npm link $DEP_NAME` in this project folder.
 5. Next time you `gulp dev` it will watch the dependency for changes as well!
