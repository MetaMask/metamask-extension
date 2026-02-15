// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import foxJson from '../../../app/build-types/main/fox.json';

const assetList = {
  main: {
    // Will use default provided by the @metamask/logo library
    foxMeshJson: foxJson,
  },
  beta: {
    foxMeshJson: undefined,
  },
  flask: {
    // Lazily load the Flask-only mascot JSON.
    //
    // Our build config treats `**/flask/**` paths as Flask-exclusive, so non-Flask builds may
    // intentionally exclude them. With code fences being removed, a top-level `import` here
    // would create a static dependency edge to a Flask-only file and would pull Flask assets
    // into their bundles. Keeping this behind a getter ensures the module is only resolved
    // when the Flask asset is actually requested.
    //
    // In this specific case, loading the JSON would not be an issue, but this serves more as an
    // example of how we can do things in the future.
    get foxMeshJson() {
      // TODO: Remove restricted require
      // eslint-disable-next-line import/no-restricted-paths, node/global-require
      return require('../../../app/build-types/flask/images/flask-mascot.json');
    },
  },
};

export function isMain() {
  return process.env.METAMASK_BUILD_TYPE === 'main';
}

export function isBeta() {
  return process.env.METAMASK_BUILD_TYPE === 'beta';
}

export function isExperimental() {
  return process.env.METAMASK_BUILD_TYPE === 'experimental';
}

export function isFlask() {
  return process.env.METAMASK_BUILD_TYPE === 'flask';
}

// Returns a specific version of an asset based on
// the current metamask version (i.e. main, beta, etc.)
export function getBuildSpecificAsset(assetName) {
  const buildType = process.env.METAMASK_BUILD_TYPE;
  if (
    !assetList[buildType] ||
    !Object.keys(assetList[buildType]).includes(assetName)
  ) {
    console.error(
      `Cannot find asset "${assetName}" for build "${buildType}", returning main build asset.`,
    );
    return assetList.main[assetName];
  }
  return assetList[buildType][assetName];
}
