import betaJson from '../../../app/build-types/beta/beta-mascot.json';
import flaskJson from '../../../app/build-types/flask/flask-mascot.json';

const assetList = {
  main: {
    // Will use default provided by the @metamask/logo library
    foxMeshJson: undefined,
  },
  beta: {
    foxMeshJson: betaJson,
  },
  flask: {
    foxMeshJson: flaskJson,
  },
};

export function isBeta() {
  return process.env.METAMASK_BUILD_TYPE === 'beta';
}

// Returns a specific version of an asset based on
// the current metamask version (i.e. main, beta, etc.)
export function getBuildSpecificAsset(assetName) {
  const buildType = process.env.METAMASK_BUILD_TYPE;
  if (
    !assetList[buildType] ||
    !Object.keys(assetList[buildType]).includes(assetName)
  ) {
    console.warn(
      `Cannot find asset for build ${buildType}: ${assetName}, returning main build asset`,
    );
    return assetList.main[assetName];
  }
  return assetList[buildType][assetName];
}
