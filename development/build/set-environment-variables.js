const { readFileSync } = require('node:fs');
const assert = require('node:assert');
const { ENVIRONMENT } = require('./constants');

/**
 * Sets environment variables to inject in the current build.
 *
 * @param {object} options - Build options.
 * @param {string} options.buildName - The name of the build.
 * @param {boolean} options.isDevBuild - Whether the build is a development build.
 * @param {boolean} options.isTestBuild - Whether the build is a test build.
 * @param {string} options.buildType - The current build type (e.g. "main",
 * "flask", etc.).
 * @param {string} options.version - The current version of the extension.
 * @param {import('../lib/variables').Variables} options.variables
 * @param {ENVIRONMENT[keyof ENVIRONMENT]} options.environment - The build environment.
 */
module.exports.setEnvironmentVariables = function setEnvironmentVariables({
  buildName,
  isDevBuild,
  isTestBuild,
  buildType,
  environment,
  variables,
  version,
}) {
  variables.set({
    DEBUG: isDevBuild || isTestBuild ? variables.getMaybe('DEBUG') : undefined,
    EIP_4337_ENTRYPOINT: isTestBuild
      ? '0x18b06605539dc02ecD3f7AB314e38eB7c1dA5c9b'
      : variables.getMaybe('EIP_4337_ENTRYPOINT'),
    IN_TEST: isTestBuild,
    INFURA_PROJECT_ID: getInfuraProjectId({
      buildType,
      variables,
      environment,
      testing: isTestBuild,
    }),
    METAMASK_DEBUG: isDevBuild || variables.getMaybe('METAMASK_DEBUG') === true,
    METAMASK_BUILD_NAME: buildName,
    METAMASK_BUILD_APP_ID: getBuildAppId({
      buildType,
    }),
    METAMASK_BUILD_ICON: getBuildIcon({
      buildType,
    }),
    METAMASK_ENVIRONMENT: environment,
    METAMASK_VERSION: version,
    METAMASK_BUILD_TYPE: buildType,
    NODE_ENV: isDevBuild ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
    PHISHING_WARNING_PAGE_URL: getPhishingWarningPageUrl({
      variables,
      testing: isTestBuild,
    }),
    SEGMENT_WRITE_KEY: getSegmentWriteKey({
      buildType,
      variables,
      environment,
    }),
    TEST_GAS_FEE_FLOWS:
      isDevBuild && variables.getMaybe('TEST_GAS_FEE_FLOWS') === true,
    DEEP_LINK_HOST: variables.getMaybe('DEEP_LINK_HOST'),
    DEEP_LINK_PUBLIC_KEY: variables.getMaybe('DEEP_LINK_PUBLIC_KEY'),
    SEEDLESS_ONBOARDING_ENABLED: isTestBuild
      ? 'true'
      : variables.getMaybe('SEEDLESS_ONBOARDING_ENABLED'),
    GOOGLE_CLIENT_ID: getGoogleClientId({
      buildType,
      variables,
      environment,
      testing: isTestBuild,
    }),
    APPLE_CLIENT_ID: getAppleClientId({
      buildType,
      variables,
      environment,
      testing: isTestBuild,
    }),
  });
};

const BUILD_TYPES_TO_SVG_LOGO_PATH = {
  main: './app/images/logo/metamask-fox.svg',
  beta: './app/build-types/beta/images/logo/metamask-fox.svg',
  flask: './app/build-types/flask/images/logo/metamask-fox.svg',
};

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
  // encode as base64 as its more space-efficient for most SVGs than a data uri
  return `data:image/svg+xml;base64,${readFileSync(svgLogoPath, 'base64')}`;
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
 * Get the Google client ID for the current build.
 *
 * @param {object} options - The Google and Apple client IDs options.
 * @param {string} options.buildType - The current build type.
 * @param {keyof ENVIRONMENT} options.environment - The current build environment.
 * @param {boolean} options.testing - Whether this is a test build or not.
 * @param {import('../lib/variables').Variables} options.variables - Object containing all variables that modify the build pipeline
 * @returns {object} The Google and Apple client IDs.
 */
function getGoogleClientId({ buildType, variables, environment, testing }) {
  const isSeedlessOnboardingEnabled =
    variables.get('SEEDLESS_ONBOARDING_ENABLED')?.toString() === 'true';
  if (
    testing ||
    environment !== ENVIRONMENT.PRODUCTION ||
    !isSeedlessOnboardingEnabled
  ) {
    if (
      isSeedlessOnboardingEnabled &&
      !variables.isDefined('GOOGLE_CLIENT_ID')
    ) {
      throw new Error(
        'GOOGLE_CLIENT_ID is not set for seedless onboarding enabled build',
      );
    }
    return variables.get('GOOGLE_CLIENT_ID');
  }

  const googleClientIdReference = variables.get('GOOGLE_CLIENT_ID_REF');
  assert(
    typeof googleClientIdReference === 'string' &&
      googleClientIdReference.length > 0,
    `Build type "${buildType}" has improperly set GOOGLE_CLIENT_ID_REF in builds.yml. Current value: "${googleClientIdReference}"`,
  );
  const googleClientId = variables.get(googleClientIdReference);
  return googleClientId;
}

/**
 * Get the Apple OAuth2 client ID for the current build.
 *
 * @param {object} options - The Apple client ID options.
 * @param {string} options.buildType - The current build type.
 * @param {keyof ENVIRONMENT} options.environment - The current build environment.
 * @param {boolean} options.testing - Whether this is a test build or not.
 * @param {import('../lib/variables').Variables} options.variables - Object containing all variables that modify the build pipeline
 * @returns {string} The Apple client ID.
 */
function getAppleClientId({ buildType, variables, environment, testing }) {
  const isSeedlessOnboardingEnabled =
    variables.get('SEEDLESS_ONBOARDING_ENABLED')?.toString() === 'true';
  if (
    testing ||
    environment !== ENVIRONMENT.PRODUCTION ||
    !isSeedlessOnboardingEnabled
  ) {
    if (
      isSeedlessOnboardingEnabled &&
      !variables.isDefined('APPLE_CLIENT_ID')
    ) {
      throw new Error(
        'APPLE_CLIENT_ID is not set for seedless onboarding enabled build',
      );
    }
    return variables.get('APPLE_CLIENT_ID');
  }

  const appleClientIdReference = variables.get('APPLE_CLIENT_ID_REF');
  assert(
    typeof appleClientIdReference === 'string' &&
      appleClientIdReference.length > 0,
    `Build type "${buildType}" has improperly set APPLE_CLIENT_ID_REF in builds.yml. Current value: "${appleClientIdReference}"`,
  );
  const appleClientId = variables.get(appleClientIdReference);
  return appleClientId;
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
      : `https://metamask.github.io/phishing-warning/v${
          // eslint-disable-next-line node/global-require
          require('@metamask/phishing-warning/package.json').version
        }/`;
  }

  let phishingWarningPageUrlObject;
  try {
    // eslint-disable-next-line no-new
    phishingWarningPageUrlObject = new URL(phishingWarningPageUrl);
  } catch (error) {
    throw new Error(
      `Invalid phishing warning page URL: '${phishingWarningPageUrl}'`,
      error,
    );
  }
  if (phishingWarningPageUrlObject.hash) {
    // The URL fragment must be set dynamically
    throw new Error(
      `URL fragment not allowed in phishing warning page URL: '${phishingWarningPageUrl}'`,
    );
  }

  // return a normalized version of the URL; a `/` will be appended to the end
  // of the domain if it is missing
  return phishingWarningPageUrlObject.toString();
}
