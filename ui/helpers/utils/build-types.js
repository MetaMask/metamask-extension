const assetList = {
  main: {
    metafoxLogoHorizontal: '/images/logo/metamask-logo-horizontal.svg',
    metafoxLogoSmall: '/images/logo/metamask-fox.svg',
    permissionsRedirectLogo: '/images/logo/metamask-fox.svg',
    aboutInfoLogo: '/images/info-logo.png',
    swapsLogo: '/images/logo/metamask-fox.svg',
  },
  beta: {
    metafoxLogoHorizontal: '/images/beta/metamask-logo-horizontal.png',
    metafoxLogoSmall: '/images/beta/metamask-header-logo.png',
    permissionsRedirectLogo: '/images/beta/64.png',
    aboutInfoLogo: '/images/beta/128.png',
    swapsLogo: '/images/beta/128.png',
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
