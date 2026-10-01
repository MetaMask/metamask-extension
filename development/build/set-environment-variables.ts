import { readFileSync } from 'node:fs';
import assert from 'node:assert';
import phishingWarningPackageJson from '@metamask/phishing-warning/package.json';
import { ENVIRONMENT, type BuildEnvironment } from './constants';

export type { BuildEnvironment };

/**
 * Variables surface required by `setEnvironmentVariables`.
 * Satisfied by `development/lib/variables` and the Map adapter in
 * `development/webpack/utils/config.ts` (without casting to the full class).
 */
export type SetEnvironmentVariablesVariables = {
  set(values: Record<string, unknown>): void;
  get(key: string): unknown;
  getMaybe(key: string): unknown;
  isDefined(key: string): boolean;
};

export type SetEnvironmentVariablesOptions = {
  buildName: string;
  isDevBuild: boolean;
  isTestBuild: boolean;
  buildType: string;
  environment: BuildEnvironment;
  variables: SetEnvironmentVariablesVariables;
  version: string;
};

/**
 * Sets environment variables to inject in the current build.
 * @param options0
 * @param options0.buildName
 * @param options0.isDevBuild
 * @param options0.isTestBuild
 * @param options0.buildType
 * @param options0.environment
 * @param options0.variables
 * @param options0.version
 */
export function setEnvironmentVariables({
  buildName,
  isDevBuild,
  isTestBuild,
  buildType,
  environment,
  variables,
  version,
}: SetEnvironmentVariablesOptions): void {
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
    SENTRY_DISTRIBUTED_TRACING_DISABLED:
      variables.getMaybe('SENTRY_DISTRIBUTED_TRACING_DISABLED') === true,
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
    CANONICAL_DEEP_LINK_HOST: variables.getMaybe('CANONICAL_DEEP_LINK_HOST'),
    DEEP_LINK_HOSTS: variables.getMaybe('DEEP_LINK_HOSTS'),
    DEEP_LINK_PUBLIC_KEY: variables.getMaybe('DEEP_LINK_PUBLIC_KEY'),
    SEEDLESS_ONBOARDING_ENABLED: isTestBuild
      ? 'true'
      : variables.getMaybe('SEEDLESS_ONBOARDING_ENABLED'),
    METAMASK_SHIELD_ENABLED: isTestBuild
      ? 'true'
      : variables.getMaybe('METAMASK_SHIELD_ENABLED'),
    PERPS_ENABLED: isTestBuild ? 'true' : variables.getMaybe('PERPS_ENABLED'),
    QR_SYNC_ENABLED: isTestBuild
      ? 'true'
      : variables.getMaybe('QR_SYNC_ENABLED'),
    COMPLIANCE_API_URL: variables.getMaybe('COMPLIANCE_API_URL'),
  });
}

const BUILD_TYPES_TO_SVG_LOGO_PATH = {
  main: './app/images/logo/metamask-fox.svg',
  beta: './app/build-types/beta/images/logo/metamask-fox.svg',
  flask: './app/build-types/flask/images/logo/metamask-fox.svg',
} as const satisfies Record<string, string>;

function getBuildIcon({ buildType }: { buildType: string }): string {
  const svgLogoPath =
    BUILD_TYPES_TO_SVG_LOGO_PATH[
      buildType as keyof typeof BUILD_TYPES_TO_SVG_LOGO_PATH
    ] ?? BUILD_TYPES_TO_SVG_LOGO_PATH.main;
  return `data:image/svg+xml;base64,${readFileSync(svgLogoPath, 'base64')}`;
}

function getBuildAppId({ buildType }: { buildType: string }): string {
  const baseDomain = 'io.metamask';
  return buildType === 'main' ? baseDomain : `${baseDomain}.${buildType}`;
}

function getInfuraProjectId({
  buildType,
  variables,
  environment,
  testing,
}: {
  buildType: string;
  variables: SetEnvironmentVariablesVariables;
  environment: BuildEnvironment;
  testing: boolean;
}): string {
  const EMPTY_PROJECT_ID = '00000000000000000000000000000000';
  if (testing) {
    return EMPTY_PROJECT_ID;
  }
  if (environment !== ENVIRONMENT.PRODUCTION) {
    if (
      !variables.isDefined('INFURA_PROJECT_ID') &&
      environment === ENVIRONMENT.PULL_REQUEST
    ) {
      return EMPTY_PROJECT_ID;
    }
    return variables.get('INFURA_PROJECT_ID') as string;
  }
  const infuraKeyReference = variables.get('INFURA_ENV_KEY_REF');
  assert(
    typeof infuraKeyReference === 'string' && infuraKeyReference.length > 0,
    `Build type "${buildType}" has improperly set INFURA_ENV_KEY_REF in builds.yml. Current value: "${String(infuraKeyReference)}"`,
  );
  const infuraProjectId = variables.get(infuraKeyReference);
  assert(
    typeof infuraProjectId === 'string' && infuraProjectId.length > 0,
    `Infura Project ID environmental variable "${infuraKeyReference}" is set improperly.`,
  );
  return infuraProjectId;
}

function getSegmentWriteKey({
  buildType,
  variables,
  environment,
}: {
  buildType: string;
  variables: SetEnvironmentVariablesVariables;
  environment: BuildEnvironment;
}): string {
  if (environment !== ENVIRONMENT.PRODUCTION) {
    return variables.get('SEGMENT_WRITE_KEY') as string;
  }

  const segmentKeyReference = variables.get('SEGMENT_WRITE_KEY_REF');
  assert(
    typeof segmentKeyReference === 'string' && segmentKeyReference.length > 0,
    `Build type "${buildType}" has improperly set SEGMENT_WRITE_KEY_REF in builds.yml. Current value: "${String(segmentKeyReference)}"`,
  );

  const segmentWriteKey = variables.get(segmentKeyReference);
  assert(
    typeof segmentWriteKey === 'string' && segmentWriteKey.length > 0,
    `Segment Write Key environmental variable "${segmentKeyReference}" is set improperly.`,
  );
  return segmentWriteKey;
}

function getPhishingWarningPageUrl({
  variables,
  testing,
}: {
  variables: SetEnvironmentVariablesVariables;
  testing: boolean;
}): string {
  const rawPhishingWarningPageUrl = variables.get('PHISHING_WARNING_PAGE_URL');

  assert(
    rawPhishingWarningPageUrl === null ||
      typeof rawPhishingWarningPageUrl === 'string',
  );
  let phishingWarningPageUrl: string;
  if (rawPhishingWarningPageUrl === null) {
    phishingWarningPageUrl = testing
      ? 'http://localhost:9999/'
      : `https://metamask.github.io/phishing-warning/v${phishingWarningPackageJson.version}/`;
  } else {
    phishingWarningPageUrl = rawPhishingWarningPageUrl;
  }

  let phishingWarningPageUrlObject: URL;
  try {
    phishingWarningPageUrlObject = new URL(phishingWarningPageUrl);
  } catch (error) {
    throw new Error(
      `Invalid phishing warning page URL: '${phishingWarningPageUrl}'`,
      { cause: error },
    );
  }
  if (phishingWarningPageUrlObject.hash) {
    throw new Error(
      `URL fragment not allowed in phishing warning page URL: '${phishingWarningPageUrl}'`,
    );
  }

  return phishingWarningPageUrlObject.toString();
}
