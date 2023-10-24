///: BEGIN:ONLY_INCLUDE_IN(build-flask)
import flaskJson from '../../../app/build-types/flask/images/flask-mascot.json';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import mmiJson from '../../../app/build-types/mmi/mmi-mascot.json';
///: END:ONLY_INCLUDE_IN

const assetList = {
  main: {
    // Will use default provided by the @metamask/logo library
    foxMeshJson: undefined,
  },
  ///: BEGIN:ONLY_INCLUDE_IN(build-beta)
  beta: {
    foxMeshJson: undefined,
  },
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  flask: {
    foxMeshJson: flaskJson,
  },
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  mmi: {
    foxMeshJson: mmiJson,
  },
  ///: END:ONLY_INCLUDE_IN
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
    console.error(
      `Cannot find asset "${assetName}" for build "${buildType}", returning main build asset.`,
    );
    return assetList.main[assetName];
  }
  return assetList[buildType][assetName];
}
