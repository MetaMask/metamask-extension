const {
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  ListNames,
  BlockProvider,
} = require('./helpers');

// last updated must not be 0
const lastUpdated = 1;
const defaultHotlist = { data: [] };
const defaultStalelist = {
  version: 2,
  tolerance: 2,
  lastUpdated,
  eth_phishing_detect_config: {
    fuzzylist: [],
    allowlist: [],
    blocklist: [],
    name: ListNames.MetaMask,
  },
  phishfort_hotlist: {
    blocklist: [],
    name: ListNames.Phishfort,
  },
};

const emptyHtmlPage = (blockProvider) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>title</title>
  </head>
  <body>
    Empty page by ${blockProvider}
  </body>
</html>`;

/**
 * Setup fetch mocks for the phishing detection feature.
 *
 * The mock configuration will show that "127.0.0.1" is blocked. The dynamic lookup on the warning
 * page can be customized, so that we can test both the MetaMask and PhishFort block cases.
 *
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 * @param {object} mockPhishingConfigResponseConfig - The response for the dynamic phishing
 * @param {number} mockPhishingConfigResponseConfig.statusCode - The status code for the response.
 * @param {string[]} mockPhishingConfigResponseConfig.blocklist - The blocklist for the response.
 * @param {BlockProvider} mockPhishingConfigResponseConfig.blockProvider - The name of the provider who blocked the page.
 * configuration lookup performed by the warning page.
 */
async function setupPhishingDetectionMocks(
  mockServer,
  {
    statusCode = 200,
    blocklist = ['127.0.0.1'],
    blockProvider = BlockProvider.MetaMask,
  },
) {
  const blockProviderConfig = resolveProviderConfigName(blockProvider);

  const response =
    statusCode >= 400
      ? { statusCode }
      : {
          statusCode,
          json: {
            data: {
              ...defaultStalelist,
              [blockProviderConfig]: {
                ...defaultStalelist[blockProviderConfig],
                blocklist,
              },
            },
          },
        };

  await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => {
    return response;
  });

  await mockServer
    .forGet(`${METAMASK_HOTLIST_DIFF_URL}/${lastUpdated}`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: defaultHotlist,
      };
    });

  await mockServer
    .forGet('https://github.com/MetaMask/eth-phishing-detect/issues/new')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage(blockProvider),
      };
    });

  await mockServer
    .forGet('https://github.com/phishfort/phishfort-lists/issues/new')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage(blockProvider),
      };
    });
}

/**
 * Mocks the request made from the phishing warning page to check eth-phishing-detect
 *
 * @param {*} mockServer
 * @param {*} metamaskPhishingConfigResponse
 */
async function mockConfigLookupOnWarningPage(
  mockServer,
  metamaskPhishingConfigResponse,
) {
  await mockServer
    .forGet(
      'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json',
    )
    .thenCallback(() => metamaskPhishingConfigResponse);
}

/**
 * Setup fallback mocks for default behaviour of the phishing detection feature.
 *
 * This sets up default mocks for a mockttp server when included in test/e2e/mock-e2e.js
 *
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 */

async function mockEmptyStalelistAndHotlist(mockServer) {
  await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => {
    return {
      statusCode: 200,
      json: { ...defaultStalelist },
    };
  });

  await mockServer
    .forGet(`${METAMASK_HOTLIST_DIFF_URL}/${lastUpdated}`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: defaultHotlist,
      };
    });
}

/**
 *
 * @param {BlockProvider} providerName - The name of the provider who issued the block.
 * @returns {string} The name of the phishing config in the response.
 */
function resolveProviderConfigName(providerName) {
  switch (providerName.toLowerCase()) {
    case BlockProvider.MetaMask:
      return 'eth_phishing_detect_config';
    case BlockProvider.PhishFort:
      return 'phishfort_hotlist';
    default:
      throw new Error('Provider name must either be metamask or phishfort');
  }
}

module.exports = {
  setupPhishingDetectionMocks,
  mockEmptyStalelistAndHotlist,
  mockConfigLookupOnWarningPage,
};
