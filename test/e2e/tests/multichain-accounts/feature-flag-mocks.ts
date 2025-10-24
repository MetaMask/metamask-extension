import { Mockttp } from 'mockttp';

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

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
            enableMultichainAccountsState2: {
              enabled: true,
              featureVersion: '2',
              minimumVersion: '12.19.0',
            },
            sendRedesign: {
              enabled: false,
            },
          },
        ],
      };
    });

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
