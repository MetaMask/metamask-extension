### Webpack strategy

Currently I am just trying to incorporate as much of our current build process into the webpack.config.ts at the root of the application, but ultimately I think we should maintain a webpack.config.js for each of our environment targets (prod, test, dev, etc).

So we might have the following files:

1. webpack.config.common.ts - Configuration shared across all builds.
2. webpack.config.prod.ts - Configuration for our production build
3. webpack.config.dev.ts - Etc, same for test, staging, rc, etc.

we will also have files for chrome, firefox,etc

1. webpack.config.chrome.ts
2. webpack.config.firefox.ts

and finally

1. webpack.config.main.ts
2. webpack.config.flask.ts

Finally we'd use https://www.npmjs.com/package/webpack-merge to merge together these configurations based on environment variables and command line options.
