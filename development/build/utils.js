const path = require('path');
const { readFileSync } = require('fs');
const semver = require('semver');
const { capitalize } = require('lodash');
const { loadBuildTypesConfig } = require('../lib/build-type');
const { BUILD_TARGETS, ENVIRONMENT } = require('./constants');

const BUILD_TYPES_TO_SVG_LOGO_PATH = {
  main: './app/images/logo/metamask-fox.svg',
  beta: './app/build-types/beta/images/logo/metamask-fox.svg',
  flask: './app/build-types/flask/images/logo/metamask-fox.svg',
  mmi: './app/build-types/mmi/images/logo/mmi-logo.svg',
  desktop: './app/build-types/desktop/images/logo/metamask-fox.svg',
};

/**
 * Returns whether the current build is a development build or not.
 *
 * @param {BUILD_TARGETS} buildTarget - The current build target.
 * @returns Whether the current build is a development build.
 */
function isDevBuild(buildTarget) {
  return (
    buildTarget === BUILD_TARGETS.DEV || buildTarget === BUILD_TARGETS.TEST_DEV
  );
}

/**
 * Returns whether the current build is an e2e test build or not.
 *
 * @param {BUILD_TARGETS} buildTarget - The current build target.
 * @returns Whether the current build is an e2e test build.
 */
function isTestBuild(buildTarget) {
  return (
    buildTarget === BUILD_TARGETS.TEST || buildTarget === BUILD_TARGETS.TEST_DEV
  );
}

/**
 * Map the current version to a format that is compatible with each browser.
 *
 * The given version number is assumed to be a SemVer version number. Additionally, if the version
 * has a prerelease component, it is assumed to have the format "<build type>.<build version",
 * where the build version is a positive integer.
 *
 * @param {string[]} platforms - A list of browsers to generate versions for.
 * @param {string} version - The current version.
 * @returns {object} An object with the browser as the key and the browser-specific version object
 * as the value.  For example, the version `9.6.0-beta.1` would return the object
 * `{ firefox: { version: '9.6.0.beta1' }, chrome: { version: '9.6.0.1', version_name: '9.6.0-beta.1' } }`.
 */
function getBrowserVersionMap(platforms, version) {
  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);
  const prerelease = semver.prerelease(version);
  let buildType, buildVersionSummary, buildVersion;
  if (prerelease) {
    [buildType, buildVersionSummary] = prerelease;
    // TODO(ritave): Figure out why the version 10.25.0-beta.1-flask.0 in the below comment is even possible
    //               since those are two different build types
    // The version could be version: '10.25.0-beta.1-flask.0',
    // That results in buildVersionSummary becomes 1-flask
    // And we only want 1 from this string
    buildVersion =
      typeof buildVersionSummary === 'string'
        ? Number(buildVersionSummary.match(/\d+(?:\.\d+)?/u)[0])
        : buildVersionSummary;
    if (!String(buildVersion).match(/^\d+$/u)) {
      throw new Error(`Invalid prerelease build version: '${buildVersion}'`);
    } else if (!loadBuildTypesConfig().buildTypes[buildType].isPrerelease) {
      throw new Error(`Invalid prerelease build type: ${buildType}`);
    }
  }

  return platforms.reduce((platformMap, platform) => {
    const versionParts = [major, minor, patch];
    const browserSpecificVersion = {};
    if (prerelease) {
      if (platform === 'firefox') {
        versionParts[2] = `${versionParts[2]}${buildType}${buildVersion}`;
      } else {
        versionParts.push(buildVersion);
        browserSpecificVersion.version_name = version;
      }
    }
    browserSpecificVersion.version = versionParts.join('.');
    platformMap[platform] = browserSpecificVersion;
    return platformMap;
  }, {});
}

/**
 * Get the environment of the current build.
 *
 * @param {object} options - Build options.
 * @param {BUILD_TARGETS} options.buildTarget - The target of the current build.
 * @returns {ENVIRONMENT} The current build environment.
 */
function getEnvironment({ buildTarget }) {
  // get environment slug
  if (buildTarget === BUILD_TARGETS.PROD) {
    return ENVIRONMENT.PRODUCTION;
  } else if (isDevBuild(buildTarget)) {
    return ENVIRONMENT.DEVELOPMENT;
  } else if (isTestBuild(buildTarget)) {
    return ENVIRONMENT.TESTING;
  } else if (
    /^Version-v(\d+)[.](\d+)[.](\d+)/u.test(process.env.CIRCLE_BRANCH)
  ) {
    return ENVIRONMENT.RELEASE_CANDIDATE;
  } else if (process.env.CIRCLE_BRANCH === 'develop') {
    return ENVIRONMENT.STAGING;
  } else if (process.env.CIRCLE_PULL_REQUEST) {
    return ENVIRONMENT.PULL_REQUEST;
  }
  return ENVIRONMENT.OTHER;
}

/**
 * Log an error to the console.
 *
 * This function includes a workaround for a SES bug that results in errors
 * being printed to the console as `{}`. The workaround is to print the stack
 * instead, which does work correctly.
 *
 * @see {@link https://github.com/endojs/endo/issues/944}
 * @param {Error} error - The error to print
 */
function logError(error) {
  console.error(error.stack || error);
}

/**
 * This function wrapAgainstScuttling() tries to generically wrap given code
 * with an environment that allows it to still function under a scuttled environment.
 *
 * It's only (current) use is for sentry code which runs before scuttling happens but
 * later on still leans on properties of the global object which at that point are scuttled.
 *
 * To accomplish that, we wrap the entire provided code with the good old with-proxy trick,
 * which helps us capture access attempts like (1) window.fetch/globalThis.fetch and (2) fetch.
 *
 * wrapAgainstScuttling() function also accepts a bag of the global object's properties the
 * code needs in order to properly function, and within our proxy we make sure to
 * return those whenever the code goes through our proxy asking for them.
 *
 * Specifically when the code tries to set properties to the global object,
 * in addition to the preconfigured properties, we also accept any property
 * starting with on to support global event handlers settings.
 *
 * Also, sentry invokes functions dynamically using Function.prototype's call and apply,
 * and our proxy messes with their this when that happens, so these two required a tailor-made patch.
 *
 * @param content - contents of the js code to wrap
 * @param bag - bag of global object properties to provide to the wrapped js code
 * @returns {string} wrapped js code
 */
function wrapAgainstScuttling(content, bag = {}) {
  return `
{
  function setupProxy(global) {
    // bag of properties to allow vetted shim to access,
    // mapped to their correct this value if needed
    const bag = ${JSON.stringify(bag)};
    // setup vetted shim bag of properties
    for (const prop in bag) {
      const that = bag[prop];
      let api = global[prop];
      if (that) api = api.bind(global[that]);
      bag[prop] = api;
    }
    // setup proxy for the vetted shim to go through
    const proxy = new Proxy(bag, {
      set: function set(target, prop, value) {
        if (bag.hasOwnProperty(prop) || prop.startsWith('on')) {
          return (bag[prop] = global[prop] = value) || true;
        }
      },
    });
    // make sure bind() and apply() are applied with
    // proxy target rather than proxy receiver
    (function(target, receiver) {
      'use strict'; // to work with ses lockdown
      function wrap(obj, prop, target, receiver) {
        const real = obj[prop];
        obj[prop] = function(that) {
          if (that === receiver) that = target;
          const args = [].slice.call(arguments, 1);
          return real.call(this, that, ...args);
        };
      }
      wrap(Function.prototype, 'bind', target, receiver);
      wrap(Function.prototype, 'apply', target, receiver);
    } (global, proxy));
    return proxy;
  }
  const proxy = setupProxy(globalThis);
  with (proxy) {
    with ({window: proxy, self: proxy, globalThis: proxy}) {
     ${content}
    }
  }
};
      `;
}

/**
 * Get the path of a file or folder inside the node_modules folder
 *
 * require.resolve was causing errors on Windows, once the paths were fed into fast-glob
 * (The backslashes had to be converted to forward-slashes)
 * This helper function was written to fix the Windows problem, and also end reliance on writing paths that start with './node_modules/'
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/pull/16550}
 * @param {string} packageName - The name of the package, such as '@lavamoat/lavapack'
 * @param {string} pathToFiles - The path of the file or folder inside the package, optionally starting with /
 */
function getPathInsideNodeModules(packageName, pathToFiles) {
  let targetPath = path.dirname(require.resolve(`${packageName}/package.json`));

  targetPath = path.join(targetPath, pathToFiles);

  // Force POSIX separators
  targetPath = targetPath.split(path.sep).join(path.posix.sep);

  return targetPath;
}

/**
 * Get the name for the current build.
 *
 * @param {object} options - The build options.
 * @param {string} options.buildType - The build type of the current build.
 * @param {boolean} options.applyLavaMoat - Flag if lavamoat was applied.
 * @param {boolean} options.shouldIncludeSnow - Flag if snow should be included in the build name.
 * @param {boolean} options.shouldIncludeMV3 - Flag if mv3 should be included in the build name.
 * @param options.environment
 * @returns {string} The build name.
 */
function getBuildName({
  environment,
  buildType,
  applyLavaMoat,
  shouldIncludeSnow,
  shouldIncludeMV3,
}) {
  if (environment === ENVIRONMENT.PRODUCTION) {
    return 'MetaMask';
  }

  const mv3Str = shouldIncludeMV3 ? ' MV3' : '';
  const lavamoatStr = applyLavaMoat ? ' lavamoat' : '';
  const snowStr = shouldIncludeSnow ? ' snow' : '';

  return buildType === 'mmi'
    ? `MetaMask Institutional${mv3Str}`
    : `MetaMask ${capitalize(buildType)}${mv3Str}${lavamoatStr}${snowStr}`;
}

/**
 * Get the app ID for the current build. Should be valid reverse FQDN.
 *
 * @param {object} options - The build options.
 * @param {string} options.buildType - The build type of the current build.
 * @returns {string} The build app ID.
 */
function getBuildAppId({ buildType }) {
  const baseDomain = 'io.metamask';
  return buildType === 'main' ? baseDomain : `${baseDomain}.${buildType}`;
}

/**
 * Get the image data uri for the svg icon for the current build.
 *
 * @param {object} options - The build options.
 * @param {string} options.buildType - The build type of the current build.
 * @returns {string} The image data uri for the icon.
 */
function getBuildIcon({ buildType }) {
  const svgLogoPath =
    BUILD_TYPES_TO_SVG_LOGO_PATH[buildType] ||
    BUILD_TYPES_TO_SVG_LOGO_PATH.main;
  const svg = readFileSync(svgLogoPath, 'utf8');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

module.exports = {
  getBrowserVersionMap,
  getBuildName,
  getBuildAppId,
  getBuildIcon,
  getEnvironment,
  isDevBuild,
  isTestBuild,
  logError,
  getPathInsideNodeModules,
  wrapAgainstScuttling,
};
