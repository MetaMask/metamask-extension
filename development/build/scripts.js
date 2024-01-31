// TODO(ritave): Remove switches on hardcoded build types

const { callbackify } = require('util');
const path = require('path');
const { writeFileSync, readFileSync } = require('fs');
const EventEmitter = require('events');
const assert = require('assert');
const gulp = require('gulp');
const watch = require('gulp-watch');
const Vinyl = require('vinyl');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('fancy-log');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
const brfs = require('brfs');
const envify = require('loose-envify/custom');
const sourcemaps = require('gulp-sourcemaps');
const applySourceMap = require('vinyl-sourcemaps-apply');
const pify = require('pify');
const through = require('through2');
const endOfStream = pify(require('end-of-stream'));
const labeledStreamSplicer = require('labeled-stream-splicer').obj;
const wrapInStream = require('pumpify').obj;
const Sqrl = require('squirrelly');
const lavapack = require('@lavamoat/lavapack');
const lavamoatBrowserify = require('lavamoat-browserify');
const terser = require('terser');

const bifyModuleGroups = require('bify-module-groups');

const phishingWarningManifest = require('@metamask/phishing-warning/package.json');
const { streamFlatMap } = require('../stream-flat-map');
const { BUILD_TARGETS, ENVIRONMENT } = require('./constants');
const { getConfig } = require('./config');
const {
  isDevBuild,
  isTestBuild,
  getEnvironment,
  logError,
  wrapAgainstScuttling,
  getBuildName,
  getBuildAppId,
  getBuildIcon,
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
  'sentry-install.js': {
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
  },
};

const mv3ScuttlingConfig = { ...scuttlingConfigBase };

const standardScuttlingConfig = {
  ...scuttlingConfigBase,
  'sentry-install.js': {
    ...scuttlingConfigBase['sentry-install.js'],
    document: '',
  },
};

/**
 * Get the appropriate Infura project ID.
 *
 * @param {object} options - The Infura project ID options.
 * @param {string} options.buildType - The current build type.
 * @param {ENVIRONMENT[keyof ENVIRONMENT]} options.environment - The build environment.
 * @param {boolean} options.testing - Whether this is a test build or not.
 * @param options.variables
 * @returns {string} The Infura project ID.
 */
function getInfuraProjectId({ buildType, variables, environment, testing }) {
  const EMPTY_PROJECT_ID = '00000000000000000000000000000000';
  if (testing) {
    return EMPTY_PROJECT_ID;
  } else if (environment !== ENVIRONMENT.PRODUCTION) {
    // Skip validation because this is unset on PRs from forks.
    // For forks, return empty project ID if we don't have one.
    if (
      !variables.isDefined('INFURA_PROJECT_ID') &&
      environment === ENVIRONMENT.PULL_REQUEST
    ) {
      return EMPTY_PROJECT_ID;
    }
    return variables.get('INFURA_PROJECT_ID');
  }
  /** @type {string|undefined} */
  const infuraKeyReference = variables.get('INFURA_ENV_KEY_REF');
  assert(
    typeof infuraKeyReference === 'string' && infuraKeyReference.length > 0,
    `Build type "${buildType}" has improperly set INFURA_ENV_KEY_REF in builds.yml. Current value: "${infuraKeyReference}"`,
  );
  /** @type {string|undefined} */
  const infuraProjectId = variables.get(infuraKeyReference);
  assert(
    typeof infuraProjectId === 'string' && infuraProjectId.length > 0,
    `Infura Project ID environmental variable "${infuraKeyReference}" is set improperly.`,
  );
  return infuraProjectId;
}

/**
 * Get the appropriate Segment write key.
 *
 * @param {object} options - The Segment write key options.
 * @param {string} options.buildType - The current build type.
 * @param {keyof ENVIRONMENT} options.environment - The current build environment.
 * @param {import('../lib/variables').Variables} options.variables - Object containing all variables that modify the build pipeline
 * @returns {string} The Segment write key.
 */
function getSegmentWriteKey({ buildType, variables, environment }) {
  if (environment !== ENVIRONMENT.PRODUCTION) {
    // Skip validation because this is unset on PRs from forks, and isn't necessary for development builds.
    return variables.get('SEGMENT_WRITE_KEY');
  }

  const segmentKeyReference = variables.get('SEGMENT_WRITE_KEY_REF');
  assert(
    typeof segmentKeyReference === 'string' && segmentKeyReference.length > 0,
    `Build type "${buildType}" has improperly set SEGMENT_WRITE_KEY_REF in builds.yml. Current value: "${segmentKeyReference}"`,
  );

  const segmentWriteKey = variables.get(segmentKeyReference);
  assert(
    typeof segmentWriteKey === 'string' && segmentWriteKey.length > 0,
    `Segment Write Key environmental variable "${segmentKeyReference}" is set improperly.`,
  );
  return segmentWriteKey;
}

/**
 * Get the URL for the phishing warning page, if it has been set.
 *
 * @param {object} options - The phishing warning page options.
 * @param {boolean} options.testing - Whether this is a test build or not.
 * @param {import('../lib/variables').Variables} options.variables - Object containing all variables that modify the build pipeline
 * @returns {string} The URL for the phishing warning page, or `undefined` if no URL is set.
 */
function getPhishingWarningPageUrl({ variables, testing }) {
  let phishingWarningPageUrl = variables.get('PHISHING_WARNING_PAGE_URL');

  assert(
    phishingWarningPageUrl === null ||
      typeof phishingWarningPageUrl === 'string',
  );
  if (phishingWarningPageUrl === null) {
    phishingWarningPageUrl = testing
      ? 'http://localhost:9999/'
      : `https://metamask.github.io/phishing-warning/v${phishingWarningManifest.version}/`;
  }

  // We add a hash/fragment to the URL dynamically, so we need to ensure it
  // has a valid pathname to append a hash to.
  const normalizedUrl = phishingWarningPageUrl.endsWith('/')
    ? phishingWarningPageUrl
    : `${phishingWarningPageUrl}/`;

  let phishingWarningPageUrlObject;
  try {
    // eslint-disable-next-line no-new
    phishingWarningPageUrlObject = new URL(normalizedUrl);
  } catch (error) {
    throw new Error(
      `Invalid phishing warning page URL: '${normalizedUrl}'`,
      error,
    );
  }
  if (phishingWarningPageUrlObject.hash) {
    // The URL fragment must be set dynamically
    throw new Error(
      `URL fragment not allowed in phishing warning page URL: '${normalizedUrl}'`,
    );
  }

  return normalizedUrl;
}

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
 * @returns {object} A set of tasks, one for each build target.
 */
function createScriptTasks({
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
    if (process.env.ENABLE_MV3 === 'true') {
      standardEntryPoints.push('offscreen');
    }

    const standardSubtask = createTask(
      `${taskPrefix}:standardEntryPoints`,
      createFactoredBuild({
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
      destFilepath: `${label}.js`,
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
      destFilepath: `${label}.js`,
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
        destFilepath: `${inpage}.js`,
        entryFilepath: `./app/scripts/${inpage}.js`,
        label: inpage,
        ignoredFiles,
        policyOnly,
        shouldLintFenceFiles,
        version,
        applyLavaMoat,
      }),
      createNormalBundle({
        buildTarget,
        buildType,
        browserPlatforms,
        destFilepath: `${contentscript}.js`,
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
 * @returns {Function} A function that creates the set of bundles.
 */
async function createManifestV3AppInitializationBundle({
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
    APPLY_LAVAMOAT: applyLavaMoat,
    FILE_NAMES: jsBundles.join(','),
  };

  await createNormalBundle({
    browserPlatforms: mv3BrowserPlatforms,
    buildTarget,
    buildType,
    destFilepath: 'app-init.js',
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
    const content = readFileSync('./dist/chrome/runtime-lavamoat.js', 'utf8');
    const fileOutput = content.replace('statsMode = false', 'statsMode = true');
    writeFileSync('./dist/chrome/runtime-lavamoat.js', fileOutput);
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
 * @returns {Function} A function that creates the set of bundles.
 */
function createFactoredBuild({
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
    await setEnvironmentVariables({
      buildTarget,
      buildType,
      environment,
      variables,
      activeBuild,
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
      policyName: buildType,
      policyOverride: path.resolve(
        __dirname,
        `../../lavamoat/browserify/policy-override.json`,
      ),
      writeAutoPolicy: process.env.WRITE_AUTO_POLICY,
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
          path: 'policy-load.js',
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

        switch (groupLabel) {
          case 'ui': {
            renderHtmlFile({
              htmlName: 'popup',
              browserPlatforms,
              applyLavaMoat,
            });
            renderHtmlFile({
              htmlName: 'notification',
              browserPlatforms,
              applyLavaMoat,
              isMMI: buildType === 'mmi',
            });
            renderHtmlFile({
              htmlName: 'home',
              browserPlatforms,
              applyLavaMoat,
              isMMI: buildType === 'mmi',
            });
            renderJavaScriptLoader({
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
              destinationFileName: 'load-app.js',
            });
            break;
          }
          case 'background': {
            renderHtmlFile({
              htmlName: 'background',
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
            });
            renderJavaScriptLoader({
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
              destinationFileName: 'load-background.js',
            });
            if (process.env.ENABLE_MV3) {
              const jsBundles = [
                ...commonSet.values(),
                ...groupSet.values(),
              ].map((label) => `./${label}.js`);
              await createManifestV3AppInitializationBundle({
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
              applyLavaMoat: false,
            });
            break;
          }
          case 'offscreen': {
            renderJavaScriptLoader({
              groupSet,
              commonSet,
              browserPlatforms,
              applyLavaMoat,
              destinationFileName: 'load-offscreen.js',
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
    await setEnvironmentVariables({
      buildTarget,
      buildType,
      variables,
      environment,
      activeBuild,
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
      // Inline `fs.readFileSync` files
      brfs,
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
    setupScuttlingWrapping(buildConfiguration, applyLavaMoat, envVars);
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

function setupScuttlingWrapping(buildConfiguration, applyLavaMoat, envVars) {
  const scuttlingConfig =
    envVars.ENABLE_MV3 === 'true'
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

    await endOfStream(pipeline);

    // call the completion event to handle any post-processing
    events.emit('bundleDone');
  }
}

/**
 * Sets environment variables to inject in the current build.
 *
 * @param {object} options - Build options.
 * @param {BUILD_TARGETS} options.buildTarget - The current build target.
 * @param {string} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string} options.version - The current version of the extension.
 * @param options.activeBuild
 * @param options.variables
 * @param options.environment
 */
async function setEnvironmentVariables({
  buildTarget,
  buildType,
  activeBuild,
  environment,
  variables,
  version,
}) {
  const devMode = isDevBuild(buildTarget);
  const testing = isTestBuild(buildTarget);

  variables.set({
    DEBUG: devMode || testing ? variables.getMaybe('DEBUG') : undefined,
    IN_TEST: testing,
    INFURA_PROJECT_ID: getInfuraProjectId({
      buildType,
      activeBuild,
      variables,
      environment,
      testing,
    }),
    METAMASK_DEBUG: devMode || variables.getMaybe('METAMASK_DEBUG') === true,
    METAMASK_BUILD_NAME: getBuildName({
      environment,
      buildType,
    }),
    METAMASK_BUILD_APP_ID: getBuildAppId({
      buildType,
    }),
    METAMASK_BUILD_ICON: getBuildIcon({
      buildType,
    }),
    METAMASK_ENVIRONMENT: environment,
    METAMASK_VERSION: version,
    METAMASK_BUILD_TYPE: buildType,
    NODE_ENV: devMode ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
    PHISHING_WARNING_PAGE_URL: getPhishingWarningPageUrl({
      variables,
      testing,
    }),
    SEGMENT_WRITE_KEY: getSegmentWriteKey({
      buildType,
      activeBuild,
      variables,
      environment,
    }),
  });
}

function renderJavaScriptLoader({
  groupSet,
  commonSet,
  browserPlatforms,
  applyLavaMoat,
  destinationFileName,
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
    ? ['./runtime-lavamoat.js', './lockdown-more.js', './policy-load.js']
    : [
        './lockdown-install.js',
        './lockdown-run.js',
        './lockdown-more.js',
        './runtime-cjs.js',
      ];

  const requiredScripts = [
    './snow.js',
    './use-snow.js',
    './globalthis.js',
    './sentry-install.js',
    ...securityScripts,
    ...jsBundles,
  ];

  browserPlatforms.forEach((platform) => {
    const appLoadFilePath = './app/scripts/load-app.js';
    const appLoadContents = readFileSync(appLoadFilePath, 'utf8');

    const scriptDest = `./dist/${platform}/${destinationFileName}`;
    const scriptOutput = appLoadContents.replace(
      '/* SCRIPTS */',
      `...${JSON.stringify(requiredScripts)}`,
    );

    writeFileSync(scriptDest, scriptOutput);
  });
}

function renderHtmlFile({ htmlName, browserPlatforms, applyLavaMoat, isMMI }) {
  if (applyLavaMoat === undefined) {
    throw new Error(
      'build/scripts/renderHtmlFile - must specify "applyLavaMoat" option',
    );
  }
  const htmlFilePath = `./app/${htmlName}.html`;
  const htmlTemplate = readFileSync(htmlFilePath, 'utf8');

  const htmlOutput = Sqrl.render(htmlTemplate, { isMMI });
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
