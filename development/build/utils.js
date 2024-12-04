const path = require('path');
const { readFileSync, writeFileSync } = require('fs');
const semver = require('semver');
const { capitalize } = require('lodash');
const { loadBuildTypesConfig } = require('../lib/build-type');
const { BUILD_TARGETS, ENVIRONMENT } = require('./constants');

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
      const { id } = loadBuildTypesConfig().buildTypes[buildType];
      if (id < 10 || id > 64 || buildVersion < 0 || buildVersion > 999) {
        throw new Error(
          `Build id must be 10-64 and release version must be 0-999
(inclusive). Received an id of '${id}' and a release version of
'${buildVersion}'.

Wait, but that seems so arbitrary?
==================================

We encode the build id and the release version into the extension version by
concatenating the two numbers together. The maximum value for the concatenated
number is 65535 (a Chromium limitation). The value cannot start with a '0'. We
utilize 2 digits for the build id and 3 for the release version. This affords us
55 release types and 1000 releases per 'version' + build type (for a minimum
value of 10000 and a maximum value of 64999).

Okay, so how do I fix it?
=========================

You'll need to adjust the build 'id' (in builds.yml) or the release version to
fit within these limits or bump the version number in package.json and start the
release version number over from 0. If you can't do that you'll need to come up
with a new way of encoding this information, or re-evaluate the need for this
metadata.

Good luck on your endeavors.`,
        );
      }
      versionParts.push(`${id}${buildVersion}`);
      if (platform !== 'firefox') {
        // firefox doesn't support `version_name`
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
  } else if (process.env.CIRCLE_BRANCH === 'main') {
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
 * @param {boolean} options.isManifestV3 - Flag if mv3 should be included in the build name.
 * @param options.environment
 * @returns {string} The build name.
 */
function getBuildName({
  environment,
  buildType,
  applyLavaMoat,
  shouldIncludeSnow,
  isManifestV3,
}) {
  const config = loadBuildTypesConfig();

  let name =
    config.buildTypes[buildType].buildNameOverride ||
    `MetaMask ${capitalize(buildType)}`;

  if (environment !== ENVIRONMENT.PRODUCTION) {
    const mv3Str = isManifestV3 ? ' MV3' : '';
    const lavamoatStr = applyLavaMoat ? ' lavamoat' : '';
    const snowStr = shouldIncludeSnow ? ' snow' : '';
    name += `${mv3Str}${lavamoatStr}${snowStr}`;
  }
  return name;
}

/**
 * Takes the given JavaScript file at `filePath` and replaces its contents with
 * a script that injects the original file contents into the document in which
 * the file is loaded. Useful for MV2 extensions to run scripts synchronously in the
 * "MAIN" world.
 *
 * @param {string} filePath - The path to the file to convert to a self-injecting
 * script.
 */
function makeSelfInjecting(filePath) {
  const fileContents = readFileSync(filePath, 'utf8');
  const textContent = JSON.stringify(fileContents);
  const js = `{let d=document,s=d.createElement('script');s.textContent=${textContent};s.nonce=btoa((globalThis.browser||chrome).runtime.getURL('/'));d.documentElement.appendChild(s).remove();}`;
  writeFileSync(filePath, js, 'utf8');
}

module.exports = {
  getBrowserVersionMap,
  getBuildName,
  getEnvironment,
  isDevBuild,
  isTestBuild,
  logError,
  getPathInsideNodeModules,
  wrapAgainstScuttling,
  makeSelfInjecting,
};
