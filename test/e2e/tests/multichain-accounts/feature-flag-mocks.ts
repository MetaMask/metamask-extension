import { existsSync, readFileSync } from 'fs';
import { Mockttp } from 'mockttp';

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

/**
 * Detects if the current build is Flask by reading the manifest.json file.
 * Flask builds have "MetaMask Flask" in the name field.
 * Tries both chrome and firefox dist directories since SELENIUM_BROWSER
 * may not be set in the pipeline.
 *
 * @returns true if this is a Flask build, false otherwise
 */
function isFlaskBuild(): boolean {
  const browsers = ['chrome', 'firefox'];

  for (const browser of browsers) {
    const manifestPath = `dist/${browser}/manifest.json`;
    try {
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        if (manifest.name?.includes('Flask')) {
          return true;
        }
      }
    } catch (error) {
      // Continue to next browser if this one fails
      continue;
    }
  }

  // If we can't read any manifest or none contain Flask, default to 'main' distribution
  return false;
}

export const BIP44_STAGE_TWO = {
  enableMultichainAccountsState2: {
    enabled: true,
    featureVersion: '2',
    minimumVersion: '12.19.0',
  },
  sendRedesign: {
    enabled: false,
  },
};

export const mockMultichainAccountsFeatureFlag = (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            enableMultichainAccounts: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '12.19.0',
            },
          },
        ],
      };
    });

// Explicitly enable the state 1 and disable the state 2 flag

export const mockMultichainAccountsFeatureFlagStateOne = (
  mockServer: Mockttp,
) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            enableMultichainAccounts: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '12.19.0',
            },
            enableMultichainAccountsState2: {
              enabled: false,
              featureVersion: '0',
              minimumVersion: '12.19.0',
            },
          },
        ],
      };
    });

export const mockMultichainAccountsFeatureFlagStateTwo = (
  mockServer: Mockttp,
) => {
  const distribution = isFlaskBuild() ? 'flask' : 'main';
  return mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution,
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [BIP44_STAGE_TWO],
      };
    });
};

export const mockMultichainAccountsFeatureFlagDisabled = (
  mockServer: Mockttp,
) =>
  mockServer.forGet(FEATURE_FLAGS_URL).thenCallback(() => {
    return {
      ok: true,
      statusCode: 200,
      json: [
        {
          enableMultichainAccounts: {
            enabled: false,
            featureVersion: '0',
            minimumVersion: '12.19.0',
          },
          enableMultichainAccountsState2: {
            enabled: false,
            featureVersion: '0',
            minimumVersion: '12.19.0',
          },
          sendRedesign: {
            enabled: false,
          },
        },
      ],
    };
  });
