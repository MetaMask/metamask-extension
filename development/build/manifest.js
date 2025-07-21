const { promises: fs } = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { merge, mergeWith, cloneDeep } = require('lodash');
const { isManifestV3 } = require('../../shared/modules/mv3.utils');

const baseManifest = isManifestV3
  ? require('../../app/manifest/v3/_base.json')
  : require('../../app/manifest/v2/_base.json');
const { loadBuildTypesConfig } = require('../lib/build-type');

const { TASKS, ENVIRONMENT, MANIFEST_DEV_KEY } = require('./constants');
const { createTask, composeSeries } = require('./task');
const { getEnvironment, getBuildName } = require('./utils');
const { fromIniFile } = require('./config');

module.exports = createManifestTasks;

async function loadManifestFlags() {
  const { definitions } = await fromIniFile(
    path.resolve(__dirname, '..', '..', '.metamaskrc'),
  );
  const manifestOverridesPath = definitions.get('MANIFEST_OVERRIDES');
  // default to undefined so that the manifest plugin can check if it was set
  let manifestFlags;
  if (manifestOverridesPath) {
    try {
      manifestFlags = await readJson(
        path.resolve(process.cwd(), manifestOverridesPath),
      );
    } catch (error) {
      // Only throw if error is not ENOENT (file not found) and manifestOverridesPath was provided
      if (error.code === 'ENOENT') {
        throw new Error(
          `Manifest override file not found: ${manifestOverridesPath}`,
        );
      }
    }
  }

  return manifestFlags;
}

function createManifestTasks({
  applyLavaMoat,
  browserPlatforms,
  browserVersionMap,
  buildType,
  entryTask,
  shouldIncludeOcapKernel = false,
  shouldIncludeSnow,
}) {
  // merge base manifest with per-platform manifests
  const prepPlatforms = async () => {
    const isDevelopment =
      getEnvironment({ buildTarget: entryTask }) === 'development';
    const manifestFlags = isDevelopment ? await loadManifestFlags() : undefined;
    return Promise.all(
      browserPlatforms.map(async (platform) => {
        const platformModifications = await readJson(
          path.join(
            __dirname,
            '..',
            '..',
            'app',
            isManifestV3 ? 'manifest/v3' : 'manifest/v2',
            `${platform}.json`,
          ),
        );
        const result = mergeWith(
          cloneDeep(baseManifest),
          platformModifications,
          browserVersionMap[platform],
          await getBuildModifications(buildType, platform),
          customArrayMerge,
          // Only include _flags if manifestFlags has content
          manifestFlags,
        );
        modifyNameAndDescForNonProd(result);

        if (shouldIncludeOcapKernel) {
          applyOcapKernelChanges(result);
        }

        const dir = path.join('.', 'dist', platform);
        await fs.mkdir(dir, { recursive: true });
        await writeJson(result, path.join(dir, 'manifest.json'));
      }),
    );
  };

  // dev: add perms
  const envDev = createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [...manifest.permissions, 'webRequestBlocking'];
    manifest.key = MANIFEST_DEV_KEY;
  });

  // testDev: add perms
  const envTestDev = createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [
      ...manifest.permissions,
      'webRequestBlocking',
      'http://localhost/*',
      'tabs', // test builds need tabs permission for switchToWindowWithTitle
    ];
    manifest.key = MANIFEST_DEV_KEY;
  });

  // test: add permissions
  const envTest = createTaskForModifyManifestForEnvironment((manifest) => {
    manifest.permissions = [
      ...manifest.permissions,
      'webRequestBlocking',
      'http://localhost/*',
      'tabs', // test builds need tabs permission for switchToWindowWithTitle
    ];
    manifest.key = MANIFEST_DEV_KEY;
  });

  const envScriptDist = createTaskForModifyManifestForEnvironment(
    (manifest) => {
      manifest.key = MANIFEST_DEV_KEY;
    },
  );

  // high level manifest tasks
  const dev = createTask(
    TASKS.MANIFEST_DEV,
    composeSeries(prepPlatforms, envDev),
  );

  const testDev = createTask(
    TASKS.MANIFEST_TEST_DEV,
    composeSeries(prepPlatforms, envTestDev),
  );

  const test = createTask(
    TASKS.MANIFEST_TEST,
    composeSeries(prepPlatforms, envTest),
  );

  const scriptDist = createTask(
    TASKS.MANIFEST_SCRIPT_DIST,
    composeSeries(prepPlatforms, envScriptDist),
  );

  const prod = createTask(TASKS.MANIFEST_PROD, prepPlatforms);

  return { prod, dev, testDev, test, scriptDist };

  // helper for modifying each platform's manifest.json in place
  function createTaskForModifyManifestForEnvironment(transformFn) {
    return () => {
      return Promise.all(
        browserPlatforms.map(async (platform) => {
          const manifestPath = path.join(
            '.',
            'dist',
            platform,
            'manifest.json',
          );
          const manifest = await readJson(manifestPath);
          transformFn(manifest);

          await writeJson(manifest, manifestPath);
        }),
      );
    };
  }

  // For non-production builds only, modify the extension's name and description
  function modifyNameAndDescForNonProd(manifest) {
    const environment = getEnvironment({ buildTarget: entryTask });

    if (environment === ENVIRONMENT.PRODUCTION) {
      return;
    }

    // Get the first 8 characters of the git revision id
    const gitRevisionStr = childProcess
      .execSync('git rev-parse HEAD')
      .toString()
      .trim()
      .substring(0, 8);

    manifest.name = getBuildName({
      environment,
      buildType,
      applyLavaMoat,
      shouldIncludeSnow,
      isManifestV3,
    });

    manifest.description = `${environment} build from git id: ${gitRevisionStr}`;
  }

  // helper for merging obj value
  function customArrayMerge(objValue, srcValue) {
    if (Array.isArray(objValue)) {
      return [...new Set([...objValue, ...srcValue])];
    }
    return undefined;
  }

  function applyOcapKernelChanges(manifest) {
    if (!Array.isArray(manifest.sandbox?.pages)) {
      merge(manifest, { sandbox: { pages: [] } });
    }
    manifest.sandbox.pages.push('ocap-kernel/vat/iframe.html');
  }
}

// helper for reading and deserializing json from fs
async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

// helper for serializing and writing json to fs
async function writeJson(obj, file) {
  return fs.writeFile(file, JSON.stringify(obj, null, 2));
}

/**
 * Get manifest modifications for the given build type, including modifications specific to the
 * given platform.
 *
 * @param {string} buildType - The build type.
 * @param {string} platform - The platform (i.e. the browser).
 * @returns {Promise<object>} The build modifications for the given build type and platform.
 */
async function getBuildModifications(buildType, platform) {
  const buildConfig = loadBuildTypesConfig();
  if (!(buildType in buildConfig.buildTypes)) {
    throw new Error(`Invalid build type: ${buildType}`);
  }

  const overridesPath = buildConfig.buildTypes[buildType].manifestOverrides;
  if (!overridesPath) {
    return {};
  }

  const builtTypeManifestDirectoryPath = path.resolve(
    process.cwd(),
    overridesPath,
  );

  const baseBuildTypeModificationsPath = path.join(
    builtTypeManifestDirectoryPath,
    '_base.json',
  );
  const buildModifications = await readJson(baseBuildTypeModificationsPath);

  const platformBuildTypeModificationsPath = path.join(
    builtTypeManifestDirectoryPath,
    `${platform}.json`,
  );
  try {
    const platformBuildTypeModifications = await readJson(
      platformBuildTypeModificationsPath,
    );
    Object.assign(buildModifications, platformBuildTypeModifications);
  } catch (error) {
    // Suppress 'ENOENT' error because it indicates there are no platform-specific manifest
    // modifications for this build type.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return buildModifications;
}
