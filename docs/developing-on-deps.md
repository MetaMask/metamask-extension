### Developing on Dependencies

To enjoy the live-reloading that `gulp dev` offers while working on the `web3-provider-engine` or other dependencies:

 1. Clone the dependency locally.
 2. `npm install` in its folder.
 3. Run `npm link` in its folder.
 4. Run `npm link $DEP_NAME` in this project folder.
 5. Next time you `npm start` it will watch the dependency for changes as well!

