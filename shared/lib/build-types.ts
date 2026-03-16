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

// This is a selective asset import, which loads different things into the bundle for different build types.
// Used properly, this should reduce the bundle sizes.
export function getFoxMeshJson() {
  // This cannot say `isFlask()` because the swc compiler will not inline that
  if (process.env.METAMASK_BUILD_TYPE === 'flask') {
    // eslint-disable-next-line import/no-restricted-paths,@typescript-eslint/no-require-imports
    return require('../../app/build-types/flask/images/flask-mascot.json');
  }

  // eslint-disable-next-line import/no-restricted-paths,@typescript-eslint/no-require-imports
  return require('../../app/build-types/main/fox.json');
}
