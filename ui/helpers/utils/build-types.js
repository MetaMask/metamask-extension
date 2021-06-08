import betaJson from '../../../app/images/beta/mascot.json';

const assetList = {
  main: {
    // Images
    metafoxLogoHorizontal: '/images/logo/metamask-logo-horizontal.svg',
    metafoxLogoHorizontalDark: '/images/logo/metamask-logo-horizontal.svg',
    metafoxLogoSmall: '/images/logo/metamask-fox.svg',
    permissionsRedirectLogo: '/images/logo/metamask-fox.svg',
    aboutInfoLogo: '/images/info-logo.png',
    swapsLogo: '/images/logo/metamask-fox.svg',

    // Mesh - will use default provided by library if standard
    foxMeshJson: undefined,
  },
  beta: {
    // Images
    metafoxLogoHorizontal: '/images/beta/metamask-logo-horizontal.svg',
    metafoxLogoHorizontalDark: '/images/beta/metamask-logo-horizontal-dark.svg',
    metafoxLogoSmall: '/images/beta/metamask-fox.svg',
    permissionsRedirectLogo: '/images/beta/metamask-fox.svg',
    aboutInfoLogo: '/images/beta/128.png',
    swapsLogo: '/images/beta/metamask-fox.svg',

    // Mesh
    foxMeshJson: betaJson,
  },
};

export function isBeta() {
  return process.env.METAMASK_BUILD_TYPE === 'beta';
}

// Returns a specific version of an asset based on
// the current metamask version (i.e. main, beta, etc.)
export function getBuildSpecificAsset(assetName) {
  const buildType = process.env.METAMASK_BUILD_TYPE;
  if (!assetList[buildType] || !assetList[buildType][assetName]) {
    console.warn(
      `Cannot find asset for build ${buildType}: ${assetName}, returning main build asset`,
    );
    return assetList.main[assetName];
  }
  return assetList[buildType][assetName];
}
