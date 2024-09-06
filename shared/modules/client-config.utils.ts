import browser from 'webextension-polyfill';

/**
 * @fileoverview This file contains utility functions for LaunchDarkly.
 */

const baseURL: string | undefined = process.env.CLIENT_CONFIG_API_BASE_URL;
const version = 'v1';

const environmentMapping: { [key: string]: string } = {
  prod: 'prod',
  dev: 'dev',
};
const buildTypeOptions: string[] = ['main', 'flask', 'qa'];

export async function getClientConfigFeatureFlags(): Promise<{
  [key: string]: boolean;
}> {
  try {
    const clientConfigUrl = buildClientConfigApiUrl(
      process.env.METAMASK_BUILD_TYPE,
      process.env.METAMASK_ENVIRONMENT,
    );
    const response = await fetch(clientConfigUrl);
    const dataArray = await response.json();
    const flagsObject = dataArray.data.reduce(
      (
        acc: { [key: string]: boolean },
        current: { [key: string]: boolean },
      ) => ({ ...acc, ...current }),
      {},
    );
    // Testing specific feature flag
    // const { testBooleanFlag } = flagsObject;
    // browser.storage.local.set({ testFlag: testBooleanFlag });
    // const x = await browser.storage.local.get('testFlag');
    // console.log('testFlag', x);

    return flagsObject;
  } catch (error) {
    console.error('Failed to fetch feature flag:', error);
    return {};
  }
}

export function buildClientConfigApiUrl(
  metamaskBuildType = 'main',
  metamaskEnvironment = 'prod',
): string {
  const client = 'mobile';
  const environment = validateEnvironment(metamaskEnvironment);
  const buildType = validateBuildType(metamaskBuildType);

  const url = `${baseURL}/${version}/flags?client=${client}&environment=${environment}&distribution=${buildType}`;

  return url;
}

function validateEnvironment(metamaskEnvironment: string): string {
  let environment = environmentMapping[metamaskEnvironment];
  if (!environment) {
    console.warn(
      `Invalid METAMASK_ENVIRONMENT value: ${metamaskEnvironment}. Must be one of ${Object.keys(
        environmentMapping,
      ).join(', ')}. Using default value: prod.`,
    );
    return 'prod';
  }
  return environment;
}

function validateBuildType(metamaskBuildType: string): string {
  if (!buildTypeOptions.includes(metamaskBuildType)) {
    console.warn(
      `Invalid METAMASK_BUILD_TYPE value: ${metamaskBuildType}. Must be one of ${buildTypeOptions.join(
        ', ',
      )}. Using default value: main.`,
    );
    return 'main';
  }
  return metamaskBuildType;
}
