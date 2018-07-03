// Karma configuration
// Generated on Mon Sep 11 2017 18:45:48 GMT-0700 (PDT)

module.exports = function (config) {
  return {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: process.cwd(),

    // Uncomment to allow for longer timeouts
    // browserNoActivityTimeout: 100000000,

    browserConsoleLogOptions: {
      terminal: false,
    },

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['qunit'],

    // list of files / patterns to load in the browser
    files: [
      'test/integration/jquery-3.1.0.min.js',
      { pattern: 'dist/chrome/images/**/*.*', watched: false, included: false, served: true },
      { pattern: 'dist/chrome/fonts/**/*.*', watched: false, included: false, served: true },
      { pattern: 'dist/chrome/_locales/**/*.*', watched: false, included: false, served: true },
    ],

    proxies: {
      '/images/': '/base/dist/chrome/images/',
      '/fonts/': '/base/dist/chrome/fonts/',
      '/_locales/': '/base/dist/chrome/_locales/',
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: process.env.browsers ?
      JSON.parse(process.env.browsers)
      : ['Chrome', 'Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: 1,

    nocache: true,
  }
}
