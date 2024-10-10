// Description: Utility functions for fetching feature flags from the feature flag API.

const buildTypeOptions: string[] = ['main', 'flask', 'qa'];
const version = 'v1';

const environmentMapping: { [key: string]: string } = {
  prod: 'prod',
  development: 'dev',
};

export async function getAllFeatureFlags(
  baseURL: string,
  buildType: string,
  environment: string,
): Promise<object> {
  try {
    const apiUrl = buildApiUrlAllFeatureFlags(baseURL, buildType, environment);
    const response = await fetch(apiUrl);
    const dataArray = await response.json();
    const flagsObject = dataArray.reduce(
      (
        acc: { [key: string]: boolean },
        current: { [key: string]: boolean },
      ) => ({ ...acc, ...current }),
      {},
    );

    return flagsObject;
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return {};
  }
}

export async function getSingleFeatureFlag(
  baseURL: string,
  flagName: string,
  buildType: string,
  environment: string,
): Promise<object> {
  try {
    const apiUrl = buildApiUrlSingleFeatureFlag(
      baseURL,
      flagName,
      buildType,
      environment,
    );
    const response = await fetch(apiUrl);
    const flagObject = await response.json();

    return flagObject;
  } catch (error) {
    console.error('Failed to fetch feature flag:', error);
    return {};
  }
}

export function buildApiUrlAllFeatureFlags(
  baseURL: string,
  metamaskBuildType = 'main',
  metamaskEnvironment = 'prod',
): string {
  const client = 'extension';
  const environment = validateEnvironment(metamaskEnvironment);
  const buildType = validateBuildType(metamaskBuildType);

  const url = `${baseURL}/${version}/flags?client=${client}&distribution=${buildType}&environment=${environment}`;

  return url;
}

export function buildApiUrlSingleFeatureFlag(
  baseURL: string,
  flagName: string,
  metamaskBuildType = 'main',
  metamaskEnvironment = 'prod',
): string {
  const client = 'extension';
  const environment = validateEnvironment(metamaskEnvironment);
  const buildType = validateBuildType(metamaskBuildType);

  const url = `${baseURL}/${version}/flags/${flagName}?client=${client}&distribution=${buildType}&environment=${environment}`;

  return url;
}

export function validateEnvironment(metamaskEnvironment: string): string {
  const environment = environmentMapping[metamaskEnvironment];
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

export function validateBuildType(metamaskBuildType: string): string {
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
