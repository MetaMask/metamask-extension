const { strict: assert } = require('assert');
const FixtureBuilder = require('../fixture-builder');
const { mockServerJsonRpc } = require('../mock-server-json-rpc');

const {
  WINDOW_TITLES,
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
  switchToNotificationWindow,
} = require('../helpers');

const bannerAlertSelector = '[data-testid="security-provider-banner-alert"]';
const selectedAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const mockMaliciousAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

const expectedMaliciousTitle = 'This is a deceptive request';

const testBenignConfigs = [
  {
    logExpectedDetail: 'benign eth_sendTransaction with no value',
    btnSelector: '#sendButton',
  },
  {
    logExpectedDetail: 'benign eth_sendTransaction with value',
    method: 'eth_sendTransaction',
    params: [
      {
        from: selectedAddress,
        to: '0xf977814e90da44bfa03b6295a0616a897441acec',
        value: '0x9184e72a000',
      },
    ],
  },
  {
    logExpectedDetail: 'benign Blur eth_sendTransaction',
    method: 'eth_signTypedData_v4',
    params: [
      selectedAddress,
      '{"types":{"Order":[{"name":"trader","type":"address"},{"name":"side","type":"uint8"},{"name":"matchingPolicy","type":"address"},{"name":"collection","type":"address"},{"name":"tokenId","type":"uint256"},{"name":"amount","type":"uint256"},{"name":"paymentToken","type":"address"},{"name":"price","type":"uint256"},{"name":"listingTime","type":"uint256"},{"name":"expirationTime","type":"uint256"},{"name":"fees","type":"Fee[]"},{"name":"salt","type":"uint256"},{"name":"extraParams","type":"bytes"},{"name":"nonce","type":"uint256"}],"Fee":[{"name":"rate","type":"uint16"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Blur Exchange","version":"1.0","chainId":"1","verifyingContract":"0x000000000000ad05ccc4f10045630fb830b95127"},"primaryType":"Order","message":{"trader":"0xd854343f41b2138b686f2d3ba38402a9f7fb4337","side":"1","matchingPolicy":"0x0000000000dab4a563819e8fd93dba3b25bc3495","collection":"0xc4a5025c4563ad0acc09d92c2506e6744dad58eb","tokenId":"30420","amount":"1","paymentToken":"0x0000000000000000000000000000000000000000","price":"1000000000000000000","listingTime":"1679418212","expirationTime":"1680023012","salt":"154790208154270131670189427454206980105","extraParams":"0x01","nonce":"0"}}',
    ],
  },
  {
    logExpectedDetail: 'benign Seaport eth_sendTransaction',
    method: 'eth_signTypedData_v4',
    params: [
      selectedAddress,
      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}]},"primaryType":"OrderComponents","domain":{"name":"Seaport","version":"1.4","chainId":"1","verifyingContract":"0x00000000000001ad428e4906aE43D8F9852d0dD6"},"message":{"offerer":"0xCaFca5eDFb361E8A39a735233f23DAf86CBeD5FC","offer":[{"itemType":"1","token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","identifierOrCriteria":"0","startAmount":"2500000000000000","endAmount":"2500000000000000"}],"consideration":[{"itemType":"2","token":"0xaA7200ee500dE2dcde75E996De83CBD73BCa9705","identifierOrCriteria":"11909","startAmount":"1","endAmount":"1","recipient":"0xCaFca5eDFb361E8A39a735233f23DAf86CBeD5FC"},{"itemType":"1","token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","identifierOrCriteria":"0","startAmount":"62500000000000","endAmount":"62500000000000","recipient":"0x0000a26b00c1F0DF003000390027140000fAa719"},{"itemType":"1","token":"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2","identifierOrCriteria":"0","startAmount":"12500000000000","endAmount":"12500000000000","recipient":"0x8324BdEF2F30E08E368f2Fa2F14143cDCA77423D"}],"startTime":"1681835413","endTime":"1682094598","orderType":"0","zone":"0x004C00500000aD104D7DBd00e3ae0A5C00560C00","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"24446860302761739304752683030156737591518664810215442929812618382526293324216","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","totalOriginalConsiderationItems":"3","counter":"0"}}',
    ],
  },
  {
    logExpectedDetail: 'benign eth_signTypedData',
    btnSelector: '#signTypedData',
  },
];

const testMaliciousConfigs = [
  {
    btnSelector: '#maliciousPermit',
    expectedDescription:
      'If you approve this request, a third party known for scams might take all your assets.',
    expectedReason: 'permit_farming',
  },
  {
    btnSelector: '#maliciousRawEthButton',
    expectedDescription:
      'If you approve this request, a third party known for scams will take all your assets.',
    expectedReason: 'raw_native_token_transfer',
  },
  {
    btnSelector: '#maliciousSeaport',
    expectedDescription:
      'If you approve this request, someone can steal your assets listed on OpenSea.',
    expectedReason: 'seaport_farming',
  },
  {
    btnSelector: '#maliciousTradeOrder',
    expectedDescription:
      'If you approve this request, you might lose your assets.',
    expectedReason: 'trade_order_farming',
  },
];

async function mockInfura(mockServer) {
  await mockServerJsonRpc(mockServer, [
    ['eth_blockNumber'],
    ['eth_call'],
    ['eth_estimateGas'],
    ['eth_feeHistory'],
    ['eth_gasPrice'],
    ['eth_getBalance'],
    ['eth_getBlockByNumber'],
    ['eth_getCode'],
    ['eth_getTransactionCount'],
  ]);
}

async function mockInfuraWithMaliciousResponses(mockServer) {
  await mockInfura(mockServer);

  await mockServer
    .forPost()
    .withJsonBodyIncluding({
      method: 'debug_traceCall',
      params: [{ accessList: [], data: '0x00000000' }],
    })
    .thenCallback((req) => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: req.body.json.id,
          result: {
            calls: [
              {
                error: 'execution reverted',
                from: '0x0000000000000000000000000000000000000000',
                gas: '0x1d55c2cb',
                gasUsed: '0x39c',
                input: '0x00000000',
                to: mockMaliciousAddress,
                type: 'DELEGATECALL',
                value: '0x0',
              },
            ],
            error: 'execution reverted',
            from: '0x0000000000000000000000000000000000000000',
            gas: '0x1dcd6500',
            gasUsed: '0x721e',
            input: '0x00000000',
            to: mockMaliciousAddress,
            type: 'CALL',
            value: '0x0',
          },
        },
      };
    });
}

/**
 * Tests various Blockaid PPOM security alerts. Some other tests live in separate files due to
 * the need for more sophisticated JSON-RPC mock requests. Some example PPOM Blockaid
 * requests and responses are provided here:
 *
 * @see {@link https://wobbly-nutmeg-8a5.notion.site/MM-E2E-Testing-1e51b617f79240a49cd3271565c6e12d}
 */
describe('Confirmation Security Alert - Blockaid @no-mmi', function () {
  /**
   * todo: fix test
   *
   * @see {@link https://github.com/MetaMask/MetaMask-planning/issues/1766}
   */
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should not show security alerts for benign requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfura,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        for (const config of testBenignConfigs) {
          const { btnSelector, logExpectedDetail, method, params } = config;

          // Either click TestDapp button to send JSON-RPC request or manually send request
          if (btnSelector) {
            await driver.clickElement(btnSelector);
          } else {
            const request = JSON.stringify({
              jsonrpc: '2.0',
              method,
              params,
            });
            await driver.executeScript(
              `window.transactionHash = window.ethereum.request(${request})`,
            );
            await driver.delay(2000);
          }

          // Wait for confirmation pop-up
          await driver.delay(500);
          await switchToNotificationWindow(driver, 3);

          const isPresent = await driver.isElementPresent(bannerAlertSelector);
          assert.equal(
            isPresent,
            false,
            `Banner alert unexpectedly found. \nExpected detail: ${logExpectedDetail}`,
          );

          // Wait for confirmation pop-up to close
          await driver.clickElement({ text: 'Reject', tag: 'button' });
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        }
      },
    );
  });

  /**
   * Disclaimer: This test does not test all reason types. e.g. 'blur_farming',
   * 'malicious_domain'. Some other tests are found in other files:
   * e.g. test/e2e/flask/ppom-blockaid-alert-<name>.spec.js
   */
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should show security alerts for malicious requests', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        testSpecificMock: mockInfuraWithMaliciousResponses,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        for (const config of testMaliciousConfigs) {
          const { expectedDescription, expectedReason, btnSelector } = config;
          console.log('config', config);

          // Click TestDapp button to send JSON-RPC request
          await driver.clickElement(btnSelector);
          await driver.delay(2000);

          // Wait for confirmation pop-up
          await driver.delay(500);
          await switchToNotificationWindow(driver, 3);

          // Find element by title
          const bannerAlertFoundByTitle = await driver.findElement({
            css: bannerAlertSelector,
            text: expectedMaliciousTitle,
          });
          const bannerAlertText = await bannerAlertFoundByTitle.getText();

          assert(
            bannerAlertFoundByTitle,
            `Banner alert not found. Expected Title: ${expectedMaliciousTitle} \nExpected reason: ${expectedReason}\n`,
          );
          assert(
            bannerAlertText.includes(expectedDescription),
            `Unexpected banner alert description. Expected: ${expectedDescription} \nExpected reason: ${expectedReason}\n`,
          );

          // Wait for confirmation pop-up to close
          await driver.clickElement({ text: 'Reject', tag: 'button' });
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        }
      },
    );
  });

  it('should show "Request may not be safe" if the PPOM request fails to check transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            securityAlertsEnabled: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        // Click TestDapp button to send JSON-RPC request
        await driver.clickElement('#maliciousApprovalButton');
        await driver.delay(2000);

        // Wait for confirmation pop-up
        await driver.delay(500);
        await switchToNotificationWindow(driver, 3);

        const expectedTitle = 'Request may not be safe';

        const bannerAlert = await driver.findElement({
          css: bannerAlertSelector,
          text: expectedTitle,
        });

        assert(
          bannerAlert,
          `Banner alert not found. Expected Title: ${expectedTitle} \nExpected reason: transfer_farming\n`,
        );
      },
    );
  });
});
