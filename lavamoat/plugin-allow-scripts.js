//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-allow-scripts",
factory: function (/** @type {(arg0: string) => { execute: any; }} */ require) {

  const { execute } = require(`@yarnpkg/shell`);
    return {
      hooks: {
        /**
         *
         * @param {*} _project
         * @param {import('@yarnpkg/core').InstallOptions} options
         */
        afterAllInstalled: async (_project, options) => {
          if (options.mode === 'update-lockfile') {
            return
          }
          const exitCode = await execute('yarn run allow-scripts')
          if (exitCode !== 0) {
            process.exit(exitCode)
          }
        },
      },
    }
  }
}
