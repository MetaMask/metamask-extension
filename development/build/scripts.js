// TODO(ritave): Remove switches on hardcoded build types
const { callbackify } = require('util');
const path = require('path');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const EventEmitter = require('events');
const gulp = require('gulp');
const watch = require('gulp-watch');
const Vinyl = require('vinyl');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('fancy-log');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');

const envify = require('loose-envify/custom');
const sourcemaps = require('gulp-sourcemaps');
const applySourceMap = require('vinyl-sourcemaps-apply');
const pify = require('pify');
const through = require('through2');
const finished = pify(require('readable-stream').finished);
const labeledStreamSplicer = require('labeled-stream-splicer').obj;
const wrapInStream = require('pumpify').obj;
const { Eta } = require('eta');
const lavapack = require('@lavamoat/lavapack');
const lavamoatBrowserify = require('lavamoat-browserify');
const terser = require('terser');

const bifyModuleGroups = require('bify-module-groups');

const { streamFlatMap } = require('../stream-flat-map');
const { isManifestV3 } = require('../../shared/modules/mv3.utils');
const { setEnvironmentVariables } = require('./set-environment-variables');
const { BUILD_TARGETS } = require('./constants');
const { getConfig } = require('./config');
const {
  isDevBuild,
  isTestBuild,
  getEnvironment,
  logError,
  wrapAgainstScuttling,
  getBuildName,
  makeSelfInjecting,
} = require('./utils');

const {
  createTask,
  composeParallel,
  composeSeries,
  runInChildProcess,
} = require('./task');
const {
  createRemoveFencedCodeTransform,
} = require('./transforms/remove-fenced-code');

// map dist files to bag of needed native APIs against LM scuttling
const scuttlingConfigBase = {
  'scripts/sentry-install.js': {
    // globals sentry need to function
    window: '',
    navigator: '',
    location: '',
    Uint16Array: '',
    fetch: '',
    String: '',
    Math: '',
    Object: '',
    Symbol: '',
    Function: '',
    Array: '',
    Boolean: '',
    Number: '',
    Request: '',
    Date: '',
    JSON: '',
    encodeURIComponent: '',
    console: '',
    crypto: '',
    Map: '',
    isFinite: '',
    // {clear/set}Timeout are "this sensitive"
    clearTimeout: 'window',
    setTimeout: 'window',
    // sentry special props
    __SENTRY__: '',
    sentryHooks: '',
    sentry: '',
    appState: '',
    extra: '',
    stateHooks: '',
    nw: '',
  },
};

const mv3ScuttlingConfig = { ...scuttlingConfigBase };

const standardScuttlingConfig = {
  ...scuttlingConfigBase,
  'scripts/sentry-install.js': {
    ...scuttlingConfigBase['scripts/sentry-install.js'],
    document: '',
  },
};

const noopWriteStream = through.obj((_file, _fileEncoding, callback) =>
  callback(),
);

module.exports = createScriptTasks;

/**
 * Create tasks for building JavaScript bundles and templates. One
 * task is returned for each build target. These build target tasks are
 * each composed of smaller tasks.
 *
 * @param {object} options - Build options.
 * @param {boolean} options.applyLavaMoat - Whether the build should use
 * LavaMoat at runtime or not.
 * @param {string[]} options.browserPlatforms - A list of browser platforms to
 * build bundles for.
 * @param {string} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string[] | null} options.ignoredFiles - A list of files to exclude
 * from the current build.
 * @param {boolean} options.isLavaMoat - Whether this build script is being run
 * using LavaMoat or not.
 * @param {object} options.livereload - The "gulp-livereload" server instance.
 * @param {boolean} options.policyOnly - Whether to stop the build after
 * generating the LavaMoat policy, skipping any writes to disk other than the
 * LavaMoat policy itself.
 * @param {boolean} options.shouldLintFenceFiles - Whether files with code
 * fences should be linted after fences have been removed.
 * @param {string} options.version - The current version of the extension.
 * @param options.shouldIncludeSnow - Whether the build should use
 * Snow at runtime or not.
 * @returns {object} A set of tasks, one for each build target.
 */
function createScriptTasks({
  shouldIncludeSnow,
  applyLavaMoat,
  browserPlatforms,
  buildType,
  ignoredFiles,
  isLavaMoat,
  livereload,
  policyOnly,
  shouldLintFenceFiles,
  version,
}) {
  // high level tasks
  return {
    // dev tasks (live reload)
    dev: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.DEV,
      taskPrefix: 'scripts:core:dev',
    }),
    // production-like distributable build
    dist: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.DIST,
      taskPrefix: 'scripts:core:dist',
    }),
    // production
    prod: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.PROD,
      taskPrefix: 'scripts:core:prod',
    }),
    // built for CI tests
    test: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.TEST,
      taskPrefix: 'scripts:core:test',
    }),
    // built for CI test debugging
    testDev: createTasksForScriptBundles({
      buildTarget: BUILD_TARGETS.TEST_DEV,
      taskPrefix: 'scripts:core:test-live',
    }),
  };

  /**
   * Define tasks for building the JavaScript modules used by the extension.
   * This function returns a single task that builds JavaScript modules in
   * parallel for a single type of build (e.g. dev, testing, production).
   *
   * @param {object} options - The build options.
   * @param {BUILD_TARGETS} options.buildTarget - The build target that these
   * JavaScript modules are intended for.
   * @param {string} options.taskPrefix - The prefix to use for the name of
   * each defined task.
   */
  function createTasksForScriptBundles({ buildTarget, taskPrefix }) {
    const standardEntryPoints = ['background', 'ui', 'content-script'];

    // In MV3 we will need to build our offscreen entry point bundle and any
    // entry points for iframes that we want to lockdown with LavaMoat.
    if (isManifestV3) {
      standardEntryPoints.push('offscreen');
    }

    const standardSubtask = createTask(
      `${taskPrefix}:standardEntryPoints`,
      createFactoredBuild({
        shouldIncludeSnow,
        applyLavaMoat,
        browserPlatforms,
        buildTarget,
        buildType,
        entryFiles: standardEntryPoints.map((label) => {
          switch (label) {
            case 'content-script':
              return './app/vendor/trezor/content-script.js';
            case 'offscreen':
              return './offscreen/scripts/offscreen.ts';
            default:
              return `./app/scripts/${label}.js`;
          }
        }),
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        version,
      }),
    );

    // inpage must be built before contentscript
    // because inpage bundle result is included inside contentscript
    const contentscriptSubtask = createTask(
      `${taskPrefix}:contentscript`,
      createContentscriptBundle({ buildTarget }),
    );

    // this can run whenever
    const disableConsoleSubtask = createTask(
      `${taskPrefix}:disable-console`,
      createDisableConsoleBundle({ buildTarget }),
    );

    // this can run whenever
    const installSentrySubtask = createTask(
      `${taskPrefix}:sentry`,
      createSentryBundle({ buildTarget }),
    );

    // task for initiating browser livereload
    const initiateLiveReload = async () => {
      if (isDevBuild(buildTarget)) {
        // trigger live reload when the bundles are updated
        // this is not ideal, but overcomes the limitations:
        // - run from the main process (not child process tasks)
        // - after the first build has completed (thus the timeout)
        // - build tasks never "complete" when run with livereload + child process
        setTimeout(() => {
          watch('./dist/*/*.js', (event) => {
            livereload.changed(event.path);
          });
        }, 75e3);
      }
    };

    // make each bundle run in a separate process
    const allSubtasks = [
      standardSubtask,
      contentscriptSubtask,
      disableConsoleSubtask,
      installSentrySubtask,
    ].map((subtask) =>
      runInChildProcess(subtask, {
        shouldIncludeSnow,
        applyLavaMoat,
        buildType,
        isLavaMoat,
        policyOnly,
        shouldLintFenceFiles,
      }),
    );
    // make a parent task that runs each task in a child thread
    return composeParallel(initiateLiveReload, ...allSubtasks);
  }

  /**
   * Create a bundle for the "disable-console" module.
   *
   * @param {object} options - The build options.
   * @param {BUILD_TARGETS} options.buildTarget - The current build target.
   * @returns {Function} A function that creates the bundle.
   */
  function createDisableConsoleBundle({ buildTarget }) {
    const label = 'disable-console';
    return createNormalBundle({
      browserPlatforms,
      buildTarget,
      buildType,
      destFilepath: `scripts/${label}.js`,
      entryFilepath: `./app/scripts/${label}.js`,
      ignoredFiles,
      label,
      policyOnly,
      shouldLintFenceFiles,
      version,
      applyLavaMoat,
    });
  }

  /**
   * Create a bundle for the "sentry-install" module.
   *
   * @param {object} options - The build options.
   * @param {BUILD_TARGETS} options.buildTarget - The current build target.
   * @returns {Function} A function that creates the bundle.
   */
  function createSentryBundle({ buildTarget }) {
    const label = 'sentry-install';
    return createNormalBundle({
      browserPlatforms,
      buildTarget,
      buildType,
      destFilepath: `scripts/${label}.js`,
      entryFilepath: `./app/scripts/${label}.js`,
      ignoredFiles,
      label,
      policyOnly,
      shouldLintFenceFiles,
      version,
      applyLavaMoat,
    });
  }

  /**
   * Create bundles for the "contentscript" and "inpage" modules. The inpage
   * module is created first because it gets embedded in the contentscript
   * module.
   *
   * @param {object} options - The build options.
   * @param {BUILD_TARGETS} options.buildTarget - The current build target.
   * @returns {Function} A function that creates the bundles.
   */
  function createContentscriptBundle({ buildTarget }) {
    const inpage = 'inpage';
    const contentscript = 'contentscript';
    return composeSeries(
      createNormalBundle({
        buildTarget,
        buildType,
        browserPlatforms,
        destFilepath: `scripts/${inpage}.js`,
        entryFilepath: `./app/scripts/${inpage}.js`,
        label: inpage,
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        version,
        applyLavaMoat,
      }),
      () => {
        // MV3 injects inpage into the tab's main world, but in MV2 we need
        // to do it manually:
        if (isManifestV3) {
          return;
        }
        // stringify scripts/inpage.js into itself, and then make it inject itself into the page
        browserPlatforms.forEach((browser) => {
          makeSelfInjecting(
            path.join(__dirname, `../../dist/${browser}/scripts/${inpage}.js`),
          );
        });
        // delete the scripts/inpage.js source map, as it no longer represents
        // scripts/inpage.js and so `yarn source-map-explorer` can't handle it.
        // It's also not useful anyway, as scripts/inpage.js is injected as a
        // `script.textContent`, and not tracked in Sentry or browsers devtools
        // anyway.
        unlinkSync(
          path.join(
            __dirname,
            `../../dist/sourcemaps/scripts/${inpage}.js.map`,
          ),
        );
      },
      createNormalBundle({
        buildTarget,
        buildType,
        browserPlatforms,
        destFilepath: `scripts/${contentscript}.js`,
        entryFilepath: `./app/scripts/${contentscript}.js`,
        label: contentscript,
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        version,
        applyLavaMoat,
      }),
    );
  }
}

/**
 * Create the bundle for the app initialization module used in manifest v3
 * builds.
 *
 * This must be called after the "background" bundles have been created, so
 * that the list of all background bundles can be injected into this bundle.
 *
 * @param {object} options - Build options.
 * @param {boolean} options.applyLavaMoat - Whether the build should use
 * LavaMoat at runtime or not.
 * @param {string[]} options.browserPlatforms - A list of browser platforms to
 * build bundles for.
 * @param {BUILD_TARGETS} options.buildTarget - The current build target.
 * @param {string} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string[] | null} options.ignoredFiles - A list of files to exclude
 * from the current build.
 * @param {string[]} options.jsBundles - A list of JavaScript bundles to be
 * injected into this bundle.
 * @param {boolean} options.policyOnly - Whether to stop the build after
 * generating the LavaMoat policy, skipping any writes to disk other than the
 * LavaMoat policy itself.
 * @param {boolean} options.shouldLintFenceFiles - Whether files with code
 * fences should be linted after fences have been removed.
 * @param {string} options.version - The current version of the extension.
 * @param options.shouldIncludeSnow - Whether the build should use
 * Snow at runtime or not.
 * @returns {Function} A function that creates the set of bundles.
 */
async function createManifestV3AppInitializationBundle({
  shouldIncludeSnow,
  applyLavaMoat,
  browserPlatforms,
  buildTarget,
  buildType,
  ignoredFiles,
  jsBundles,
  policyOnly,
  shouldLintFenceFiles,
  version,
}) {
  const label = 'app-init';
  // TODO: remove this filter for firefox once MV3 is supported in it
  const mv3BrowserPlatforms = browserPlatforms.filter(
    (platform) => platform !== 'firefox',
  );

  for (const filename of jsBundles) {
    if (filename.includes(',')) {
      throw new Error(
        `Invalid filename "${filename}", not allowed to contain comma.`,
      );
    }
  }

  const extraEnvironmentVariables = {
    USE_SNOW: shouldIncludeSnow,
    APPLY_LAVAMOAT: applyLavaMoat,
    FILE_NAMES: jsBundles.join(','),
  };

  await createNormalBundle({
    browserPlatforms: mv3BrowserPlatforms,
    buildTarget,
    buildType,
    destFilepath: 'scripts/app-init.js',
    entryFilepath: './app/scripts/app-init.js',
    extraEnvironmentVariables,
    ignoredFiles,
    label,
    policyOnly,
    shouldLintFenceFiles,
    version,
    applyLavaMoat,
  })();

  // Code below is used to set statsMode to true when testing in MV3
  // This is used to capture module initialisation stats using lavamoat.
  if (isTestBuild(buildTarget)) {
    const content = readFileSync(
      './dist/chrome/scripts/runtime-lavamoat.js',
      'utf8',
    );
    const fileOutput = content.replace('statsMode = false', 'statsMode = true');
    writeFileSync('./dist/chrome/scripts/runtime-lavamoat.js', fileOutput);
  }

  console.log(`Bundle end: service worker app-init.js`);
}

/**
 * Return a function that creates a set of factored bundles.
 *
 * For each entry point, a series of one or more bundles is created. These are
 * split up roughly by size, to ensure no single bundle exceeds the maximum
 * JavaScript file size imposed by Firefox.
 *
 * Modules that are common between all entry points are bundled separately, as
 * a set of one or more "common" bundles.
 *
 * @param {object} options - Build options.
 * @param {boolean} options.applyLavaMoat - Whether the build should use
 * LavaMoat at runtime or not.
 * @param {string[]} options.browserPlatforms - A list of browser platforms to
 * build bundles for.
 * @param {BUILD_TARGETS} options.buildTarget - The current build target.
 * @param {string} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string[]} options.entryFiles - A list of entry point file paths,
 * relative to the repository root directory.
 * @param {string[] | null} options.ignoredFiles - A list of files to exclude
 * from the current build.
 * @param {boolean} options.policyOnly - Whether to stop the build after
 * generating the LavaMoat policy, skipping any writes to disk other than the
 * LavaMoat policy itself.
 * @param {boolean} options.shouldLintFenceFiles - Whether files with code
 * fences should be linted after fences have been removed.
 * @param {string} options.version - The current version of the extension.
 * @param options.shouldIncludeSnow - Whether the build should use
 * Snow at runtime or not.
 * @returns {Function} A function that creates the set of bundles.
 */
function createFactoredBuild({
  shouldIncludeSnow,
  applyLavaMoat,
  browserPlatforms,
  buildTarget,
  buildType,
  entryFiles,
  ignoredFiles,
  policyOnly,
  shouldLintFenceFiles,
  version,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = 'primary';
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const reloadOnChange = isDevBuild(buildTarget);
    const minify = !isDevBuild(buildTarget);

    const environment = getEnvironment({ buildTarget });
    const config = await getConfig(buildType, environment);
    const { variables, activeBuild } = config;
    setEnvironmentVariables({
      isDevBuild: reloadOnChange,
      isTestBuild: isTestBuild(buildTarget),
      buildName: getBuildName({
        environment,
        buildType,
      }),
      buildType,
      environment,
      variables,
      version,
    });
    const features = {
      active: new Set(activeBuild.features ?? []),
      all: new Set(Object.keys(config.buildsYml.features)),
    };
    setupBundlerDefaults(buildConfiguration, {
      buildTarget,
      variables,
      envVars: buildSafeVariableObject(variables),
      ignoredFiles,
      policyOnly,
      minify,
      features,
      reloadOnChange,
      shouldLintFenceFiles,
    });

    // set bundle entries
    bundlerOpts.entries = [...entryFiles];

    // setup lavamoat
    // lavamoat will add lavapack but it will be removed by bify-module-groups
    // we will re-add it later by installing a lavapack runtime
    const lavamoatOpts = {
      policy: path.resolve(
        __dirname,
        `../../lavamoat/browserify/${buildType}/policy.json`,
      ),
      policyDebug: path.resolve(
        __dirname,
        `../../lavamoat/browserify/${buildType}/policy-debug.json`,
      ),
      policyName: buildType,
      policyOverride: path.resolve(
        __dirname,
        `../../lavamoat/browserify/policy-override.json`,
      ),
      writeAutoPolicy: process.env.WRITE_AUTO_POLICY,
      writeAutoPolicyDebug: process.env.WRITE_AUTO_POLICY_DEBUG,
    };
    Object.assign(bundlerOpts, lavamoatBrowserify.args);
    bundlerOpts.plugin.push([lavamoatBrowserify, lavamoatOpts]);

    // setup bundle factoring with bify-module-groups plugin
    // note: this will remove lavapack, but its ok bc we manually readd it later
    Object.assign(bundlerOpts, bifyModuleGroups.plugin.args);
    bundlerOpts.plugin = [...bundlerOpts.plugin, [bifyModuleGroups.plugin]];

    // instrument pipeline
    let sizeGroupMap;
    events.on('configurePipeline', ({ pipeline }) => {
      // to be populated by the group-by-size transform
      sizeGroupMap = new Map();
      pipeline.get('groups').unshift(
        // factor modules
        bifyModuleGroups.groupByFactor({
          entryFileToLabel(filepath) {
            return path.parse(filepath).name;
          },
        }),
        // cap files at 2 mb
        bifyModuleGroups.groupBySize({
          sizeLimit: 2e6,
          groupingMap: sizeGroupMap,
        }),
      );
      // converts each module group into a single vinyl file containing its bundle
      const moduleGroupPackerStream = streamFlatMap((moduleGroup) => {
        const filename = `${moduleGroup.label}.js`;
        const childStream = wrapInStream(
          moduleGroup.stream,
          // we manually readd lavapack here bc bify-module-groups removes it
          lavapack({ raw: true, hasExports: true, includePrelude: false }),
          source(filename),
        );
        return childStream;
      });
      pipeline.get('vinyl').unshift(moduleGroupPackerStream, buffer());
      // add lavamoat policy loader file to packer output
      moduleGroupPackerStream.push(
        new Vinyl({
          path: 'scripts/policy-load.js',
          contents: lavapack.makePolicyLoaderStream(lavamoatOpts),
        }),
      );
      // setup bundle destination
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}/`;
        const destination = policyOnly ? noopWriteStream : gulp.dest(dest);
        pipeline.get('dest').push(destination);
      });
    });

    // wait for bundle completion for postprocessing
    events.on('bundleDone', async () => {
      // Skip HTML generation if nothing is to be written to disk
      if (policyOnly) {
        return;
      }
      const commonSet = sizeGroupMap.get('common');
      // create entry points for each file
      for (const [groupLabel, groupSet] of sizeGroupMap.entries()) {
        // skip "common" group, they are added to all other groups
        if (groupSet === commonSet) {
          continue;
        }

        const isTest =
          buildTarget === BUILD_TARGETS.TEST ||
          buildTarget === BUILD_TARGETS.TEST_DEV;
        const scripts = getScriptTags({
          groupSet,
          commonSet,
          shouldIncludeSnow,
          applyLavaMoat,
        });
        switch (groupLabel) {
          case 'ui': {
            renderHtmlFile({
              htmlName: 'loading',
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              isMMI: buildType === 'mmi',
              scripts,
            });
            renderHtmlFile({
              htmlName: 'popup',
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              scripts,
            });
            renderHtmlFile({
              htmlName: 'popup-init',
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              scripts,
            });
            renderHtmlFile({
              htmlName: 'notification',
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              isMMI: buildType === 'mmi',
              isTest,
              scripts,
            });
            renderHtmlFile({
              htmlName: 'home',
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              isMMI: buildType === 'mmi',
              isTest,
              scripts,
            });
            break;
          }
          case 'background': {
            renderHtmlFile({
              htmlName: 'background',
              groupSet,
              commonSet,
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              scripts,
            });
            if (isManifestV3) {
              const jsBundles = [
                ...commonSet.values(),
                ...groupSet.values(),
              ].map((label) => `../${label}.js`);
              await createManifestV3AppInitializationBundle({
                shouldIncludeSnow,
                applyLavaMoat,
                browserPlatforms,
                buildTarget,
                buildType,
                ignoredFiles,
                jsBundles,
                policyOnly,
                shouldLintFenceFiles,
                version,
              });
            }
            break;
          }
          case 'content-script': {
            renderHtmlFile({
              htmlName: 'trezor-usb-permissions',
              groupSet,
              commonSet,
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat: false,
              scripts,
            });
            break;
          }
          case 'offscreen': {
            renderHtmlFile({
              htmlName: 'offscreen',
              groupSet,
              commonSet,
              browserPlatforms,
              shouldIncludeSnow,
              applyLavaMoat,
              scripts,
            });
            break;
          }
          default: {
            throw new Error(
              `build/scripts - unknown groupLabel "${groupLabel}"`,
            );
          }
        }
      }
    });

    await createBundle(buildConfiguration, { reloadOnChange });
  };
}

/**
 * Return a function that creates a single JavaScript bundle.
 *
 * @param {object} options - Build options.
 * @param {string[]} options.browserPlatforms - A list of browser platforms to
 * build the bundle for.
 * @param {BUILD_TARGETS} options.buildTarget - The current build target.
 * @param {string} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string} options.destFilepath - The file path the bundle should be
 * written to.
 * @param {string[]} options.entryFilepath - The entry point file path,
 * relative to the repository root directory.
 * @param {Record<string, unknown>} options.extraEnvironmentVariables - Extra
 * environment variables to inject just into this bundle.
 * @param {string[] | null} options.ignoredFiles - A list of files to exclude
 * from the current build.
 * @param {string} options.label - A label used to describe this bundle in any
 * diagnostic messages.
 * @param {boolean} options.policyOnly - Whether to stop the build after
 * generating the LavaMoat policy, skipping any writes to disk other than the
 * LavaMoat policy itself.
 * @param {boolean} options.shouldLintFenceFiles - Whether files with code
 * fences should be linted after fences have been removed.
 * @param {string} options.version - The current version of the extension.
 * @param {boolean} options.applyLavaMoat - Whether to apply LavaMoat or not
 * @returns {Function} A function that creates the bundle.
 */
function createNormalBundle({
  browserPlatforms,
  buildTarget,
  buildType,
  destFilepath,
  entryFilepath,
  extraEnvironmentVariables,
  ignoredFiles,
  label,
  policyOnly,
  shouldLintFenceFiles,
  version,
  applyLavaMoat,
}) {
  return async function () {
    // create bundler setup and apply defaults
    const buildConfiguration = createBuildConfiguration();
    buildConfiguration.label = label;
    const { bundlerOpts, events } = buildConfiguration;

    // devMode options
    const devMode = isDevBuild(buildTarget);
    const reloadOnChange = Boolean(devMode);
    const minify = Boolean(devMode) === false;

    const environment = getEnvironment({ buildTarget });
    const config = await getConfig(buildType, environment);
    const { activeBuild, variables } = config;
    setEnvironmentVariables({
      buildName: getBuildName({
        environment,
        buildType,
      }),
      isDevBuild: devMode,
      isTestBuild: isTestBuild(buildTarget),
      buildType,
      variables,
      environment,
      version,
    });
    Object.entries(extraEnvironmentVariables ?? {}).forEach(([key, value]) =>
      variables.set(key, value),
    );

    const features = {
      active: new Set(activeBuild.features ?? []),
      all: new Set(Object.keys(config.buildsYml.features)),
    };
    setupBundlerDefaults(buildConfiguration, {
      envVars: buildSafeVariableObject(variables),
      ignoredFiles,
      policyOnly,
      minify,
      features,
      reloadOnChange,
      shouldLintFenceFiles,
      applyLavaMoat,
    });

    // set bundle entries
    bundlerOpts.entries = [entryFilepath];

    // instrument pipeline
    events.on('configurePipeline', ({ pipeline }) => {
      // convert bundle stream to gulp vinyl stream
      // and ensure file contents are buffered
      pipeline.get('vinyl').push(source(destFilepath));
      pipeline.get('vinyl').push(buffer());
      // setup bundle destination
      browserPlatforms.forEach((platform) => {
        const dest = `./dist/${platform}/`;
        const destination = policyOnly ? noopWriteStream : gulp.dest(dest);
        pipeline.get('dest').push(destination);
      });
    });

    await createBundle(buildConfiguration, { reloadOnChange });
  };
}

function createBuildConfiguration() {
  const label = '(unnamed bundle)';
  const events = new EventEmitter();
  const bundlerOpts = {
    entries: [],
    transform: [],
    plugin: [],
    require: [],
    // non-standard bify options
    manualExternal: [],
    manualIgnore: [],
  };
  return { bundlerOpts, events, label };
}

function setupBundlerDefaults(
  buildConfiguration,
  {
    buildTarget,
    envVars,
    ignoredFiles,
    policyOnly,
    minify,
    features,
    reloadOnChange,
    shouldLintFenceFiles,
    applyLavaMoat,
  },
) {
  const { bundlerOpts } = buildConfiguration;
  const extensions = ['.js', '.ts', '.tsx'];

  Object.assign(bundlerOpts, {
    // Source transforms
    transform: [
      // // Remove code that should be excluded from builds of the current type
      createRemoveFencedCodeTransform(features, shouldLintFenceFiles),
      // Transpile top-level code
      [
        babelify,
        // Run TypeScript files through Babel
        {
          extensions,
        },
      ],
      // We are transpelling the firebase package to be compatible with the lavaMoat restrictions
      [
        babelify,
        {
          only: [
            './**/node_modules/firebase',
            './**/node_modules/@firebase',
            './**/node_modules/marked',
          ],
          global: true,
        },
      ],
    ],
    // Look for TypeScript files when walking the dependency tree
    extensions,
    // Use entryFilepath for moduleIds, easier to determine origin file
    fullPaths: isDevBuild(buildTarget) || isTestBuild(buildTarget),
    // For sourcemaps
    debug: true,
  });

  // Ensure react-devtools is only included in dev builds
  if (buildTarget !== BUILD_TARGETS.DEV) {
    bundlerOpts.manualIgnore.push('react-devtools');
    bundlerOpts.manualIgnore.push('remote-redux-devtools');
  }

  // This dependency uses WASM which we cannot execute in accordance with our CSP
  bundlerOpts.manualIgnore.push('@chainsafe/as-sha256');

  // Inject environment variables via node-style `process.env`
  if (envVars) {
    bundlerOpts.transform.push([envify(envVars), { global: true }]);
  }

  // Ensure that any files that should be ignored are excluded from the build
  if (ignoredFiles) {
    bundlerOpts.manualExclude = ignoredFiles;
  }

  // Setup reload on change
  if (reloadOnChange) {
    setupReloadOnChange(buildConfiguration);
  }

  if (!policyOnly) {
    if (minify) {
      setupMinification(buildConfiguration);
    }

    // Setup source maps
    setupSourcemaps(buildConfiguration, { buildTarget });
    // Setup wrapping of code against scuttling (before sourcemaps generation)
    setupScuttlingWrapping(buildConfiguration, applyLavaMoat);
  }
}

function setupReloadOnChange({ bundlerOpts, events }) {
  // Add plugin to options
  Object.assign(bundlerOpts, {
    plugin: [...bundlerOpts.plugin, watchify],
    // Required by watchify
    cache: {},
    packageCache: {},
  });
  // Instrument pipeline
  events.on('configurePipeline', ({ bundleStream }) => {
    // Handle build error to avoid breaking build process
    // (eg on syntax error)
    bundleStream.on('error', (err) => {
      gracefulError(err);
    });
  });
}

function setupMinification(buildConfiguration) {
  const minifyOpts = {
    mangle: {
      reserved: ['MetamaskInpageProvider'],
    },
  };
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('minify').push(
      // this is the "gulp-terser-js" wrapper around the latest version of terser
      through.obj(
        callbackify(async (file, _enc) => {
          const input = {
            [file.sourceMap.file]: file.contents.toString(),
          };
          const opts = {
            sourceMap: {
              filename: file.sourceMap.file,
              content: file.sourceMap,
            },
            ...minifyOpts,
          };
          const res = await terser.minify(input, opts);
          file.contents = Buffer.from(res.code);
          applySourceMap(file, res.map);
          return file;
        }),
      ),
    );
  });
}

function setupScuttlingWrapping(buildConfiguration, applyLavaMoat) {
  const scuttlingConfig = isManifestV3
    ? mv3ScuttlingConfig
    : standardScuttlingConfig;
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('scuttle').push(
      through.obj(
        callbackify(async (file, _enc) => {
          const configForFile = scuttlingConfig[file.relative];
          if (applyLavaMoat && configForFile) {
            const wrapped = wrapAgainstScuttling(
              file.contents.toString(),
              configForFile,
            );
            file.contents = Buffer.from(wrapped, 'utf8');
          }
          return file;
        }),
      ),
    );
  });
}

function setupSourcemaps(buildConfiguration, { buildTarget }) {
  const { events } = buildConfiguration;
  events.on('configurePipeline', ({ pipeline }) => {
    pipeline.get('sourcemaps:init').push(sourcemaps.init({ loadMaps: true }));
    pipeline
      .get('sourcemaps:write')
      // Use inline source maps for development due to Chrome DevTools bug
      // https://bugs.chromium.org/p/chromium/issues/detail?id=931675
      .push(
        isDevBuild(buildTarget)
          ? sourcemaps.write()
          : sourcemaps.write('../sourcemaps', { addComment: false }),
      );
  });
}

async function createBundle(buildConfiguration, { reloadOnChange }) {
  const { label, bundlerOpts, events } = buildConfiguration;
  const bundler = browserify(bundlerOpts);

  // manually apply non-standard options
  bundler.external(bundlerOpts.manualExternal);
  bundler.ignore(bundlerOpts.manualIgnore);
  if (Array.isArray(bundlerOpts.manualExclude)) {
    bundler.exclude(bundlerOpts.manualExclude);
  }

  // output build logs to terminal
  bundler.on('log', log);

  // forward update event (used by watchify)
  bundler.on('update', () => performBundle());

  console.log(`Bundle start: "${label}"`);
  await performBundle();
  console.log(`Bundle end: "${label}"`);

  async function performBundle() {
    // this pipeline is created for every bundle
    // the labels are all the steps you can hook into
    const pipeline = labeledStreamSplicer([
      'groups',
      [],
      'vinyl',
      [],
      'scuttle',
      [],
      'sourcemaps:init',
      [],
      'minify',
      [],
      'sourcemaps:write',
      [],
      'dest',
      [],
    ]);
    const bundleStream = bundler.bundle();
    if (!reloadOnChange) {
      bundleStream.on('error', (error) => {
        console.error('Bundling failed! See details below.');
        logError(error);
        process.exit(1);
      });
      pipeline.on('error', (error) => {
        console.error('Pipeline failed! See details below.');
        logError(error);
        process.exit(1);
      });
    }
    // trigger build pipeline instrumentations
    events.emit('configurePipeline', { pipeline, bundleStream });
    // start bundle, send into pipeline
    bundleStream.pipe(pipeline);
    // nothing will consume pipeline, so let it flow
    pipeline.resume();

    await finished(pipeline);

    // call the completion event to handle any post-processing
    events.emit('bundleDone');
  }
}

function getScriptTags({
  groupSet,
  commonSet,
  shouldIncludeSnow,
  applyLavaMoat,
}) {
  if (applyLavaMoat === undefined) {
    throw new Error(
      'build/scripts/renderHtmlFile - must specify "applyLavaMoat" option',
    );
  }

  const jsBundles = [...commonSet.values(), ...groupSet.values()].map(
    (label) => `./${label}.js`,
  );

  const securityScripts = applyLavaMoat
    ? [
        './scripts/runtime-lavamoat.js',
        './scripts/lockdown-more.js',
        './scripts/policy-load.js',
      ]
    : [
        './scripts/lockdown-install.js',
        './scripts/lockdown-run.js',
        './scripts/lockdown-more.js',
        './scripts/runtime-cjs.js',
      ];

  const requiredScripts = [
    ...(shouldIncludeSnow
      ? ['./scripts/snow.js', './scripts/use-snow.js']
      : []),
    './scripts/sentry-install.js',
    ...securityScripts,
    ...jsBundles,
  ];

  return requiredScripts.map((src) => {
    return `<script src="${src}" defer></script>`;
  });
}

function renderHtmlFile({
  htmlName,
  browserPlatforms,
  shouldIncludeSnow,
  applyLavaMoat,
  isMMI,
  isTest,
  scripts = [],
}) {
  if (applyLavaMoat === undefined) {
    throw new Error(
      'build/scripts/renderHtmlFile - must specify "applyLavaMoat" option',
    );
  }
  if (shouldIncludeSnow === undefined) {
    throw new Error(
      'build/scripts/renderHtmlFile - must specify "shouldIncludeSnow" option',
    );
  }

  const scriptTags = scripts.join('\n    ');

  const htmlFilePath =
    htmlName === 'offscreen'
      ? `./offscreen/${htmlName}.html`
      : `./app/${htmlName}.html`;
  const htmlTemplate = readFileSync(htmlFilePath, 'utf8');

  const eta = new Eta();
  const htmlOutput = eta
    .renderString(htmlTemplate, { isMMI, isTest, shouldIncludeSnow })
    // these replacements are added to support the webpack build's automatic
    // compilation of html files, which the gulp-based process doesn't support.
    .replace('./scripts/load/background.ts', './load-background.js')
    .replace(
      '<script src="./load-background.js" defer></script>',
      `${scriptTags}\n    <script src="./chromereload.js" async></script>`,
    )
    .replace('<script src="./scripts/load/ui.ts" defer></script>', scriptTags)
    .replace('<script src="./load-offscreen.js" defer></script>', scriptTags)
    .replace('../ui/css/index.scss', './index.css')
    .replace('@lavamoat/snow/snow.prod.js', './scripts/snow.js');
  browserPlatforms.forEach((platform) => {
    const dest = `./dist/${platform}/${htmlName}.html`;
    // we dont have a way of creating async events atm
    writeFileSync(dest, htmlOutput);
  });
}

/**
 * Builds a javascript object that throws an error when trying to access a property that wasn't defined properly
 *
 * @param {Variables} variables
 * @returns {{[key: string]: unknown }} Variable definitions
 */
function buildSafeVariableObject(variables) {
  return new Proxy(
    {},
    {
      has(_, key) {
        return key !== '_'; // loose-envify uses "_" for settings
      },
      get(_, key) {
        if (key === '_') {
          return undefined; // loose-envify uses "_" for settings
        }
        return variables.get(key);
      },
    },
  );
}

function beep() {
  process.stdout.write('\x07');
}

function gracefulError(err) {
  console.warn(err);
  beep();
}
