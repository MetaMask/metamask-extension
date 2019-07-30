### Developing on Dependencies

To enjoy the live-reloading that `gulp dev` offers while working on the dependencies:

 1. Clone the dependency locally.
 2. `npm install` or `yarn install` in its folder.
 3. Run `yarn link` in its folder.
 4. Run `yarn link $DEP_NAME` in this project folder.
 5. Next time you `yarn start` it will watch the dependency for changes as well!
