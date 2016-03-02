# Metamask Plugin

## Development

```bash
npm install --global grunt-cli
npm install
grunt dev
```

### In Chrome

Open `Settings` > `Extensions`.

Check "Developer mode".

At the top, click `Load Unpacked Extension`.

Navigate to your `metamask-plugin/dist` folder.

Click `Select`.

You now have the plugin, and can click 'inspect views: background plugin' to view its dev console.

### Developing the UI

To enjoy the live-reloading that `grunt dev` offers while working on the `metamask-ui` or `web3-provider-enigne` dependencies:

 1. Clone the dependency locally.
 2. `npm install` in its folder.
 3. Run `npm link` in its folder.
 4. Run `npm link $DEP_NAME` in this project folder.
 5. Next time you `grunt dev` it will watch the dependency for changes as well!
