const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const STALELIST_URL = 'https://eos9d7dmfj.execute-api.us-east-1.amazonaws.com/metamask/validate';

/**
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 * @param {object} metamaskSecurityProviderConfigResponse - The response for the dynamic phishing
 * configuration lookup performed by the warning page.
 */

const setupSecurityProviderMocks = (mockServer) => {
  mockServer.forPost(STALELIST_URL).thenCallback((req, res) => {
    const requestBody = JSON.parse(req.body.toString());
    let responseBody;
    switch (requestBody.token_id) {
      case 'not_malicious':
        responseBody = {
          flagAsDangerous: 0,
        };
        break;
      case 'malicious':
        responseBody = {
          flagAsDangerous: 1,
          reason: 'This is a malicious website',
          reason_header: 'Warning: Malicious Website',
        };
        break;
      case 'not_safe':
        responseBody = {
          flagAsDangerous: 1,
          reason: 'This website is not safe',
          reason_header: 'Warning: Not Safe',
        };
        break;
      case 'not_verified':
        responseBody = {
          flagAsDangerous: 1,
          reason: 'Request not verified',
          reason_header: 'Warning: Request Not Verified',
        };
        break;
      default:
        throw new Error(`Unexpected token_id: ${requestBody.token_id}`);
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(responseBody));
  });
};

describe('Security Provider', function () {
  function mockSecurityProviderDetection(mockServer) {
    setupSecurityProviderMocks(mockServer);
  }
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should display the MetaMask Phishing Detection page and take the user to the blocked page if they continue', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()({ openSeaEnabled: true }).build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockSecurityProviderDetection,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage('http://127.0.0.1:8080');
        await driver.clickElement({
          text: 'continue to the site.',
        });
      }
    );
  });
});