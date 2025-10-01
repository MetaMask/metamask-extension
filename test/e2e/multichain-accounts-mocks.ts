const { Mockttp } = require('mockttp');

const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

const mockMultichainAccountsFeatureFlagDisabled = (
  mockServer,
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
              enabled: false,
              featureVersion: '0',
              minimumVersion: '12.19.0',
            },
          },
          {
            enableMultichainAccountsState2: {
              enabled: false,
              featureVersion: '0',
              minimumVersion: '12.19.0',
            },
          },
        ],
      };
    });

module.exports = {
  FEATURE_FLAGS_URL,
  mockMultichainAccountsFeatureFlagDisabled,
};
