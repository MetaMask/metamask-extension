const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
  getEventPayloads,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const SIGNATURE_CONFIRMATIONS = [
  { name: 'Personal Sign signature', testDAppBtnId: 'personalSign' },
  { name: 'Sign Typed Data signature', testDAppBtnId: 'signTypedData' },
  { name: 'Sign Typed Data v3 signature', testDAppBtnId: 'signTypedDataV3' },
  { name: 'Sign Typed Data v4 signature', testDAppBtnId: 'signTypedDataV4' },
  { name: 'Sign Permit signature', testDAppBtnId: 'signPermit' },
];

const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
const WALLET_ETH_BALANCE = '25';

describe('Confirmation Header Component', function () {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  SIGNATURE_CONFIRMATIONS.forEach((confirmation) => {
    it(`${confirmation.name} component includes header with balance and sends the right metrics`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
          testSpecificMock: mockSegment,
        },
        async ({ driver, mockedEndpoint: mockedEndpoints }) => {
          await unlockWallet(driver);
          await openDapp(driver);

          await clickConfirmationBtnOnTestDapp(
            driver,
            confirmation.testDAppBtnId,
          );
          await clickHeaderInfoBtn(driver);

          await assertHeaderInfoBalance(driver, WALLET_ETH_BALANCE);
          const events = await getEventPayloads(driver, mockedEndpoints);
          assert.deepStrictEqual(events[0].properties, {
            account_type: 'MetaMask',
            signature_type: 'eth_sign',
            category: 'inpage_provider',
            locale: 'en',
            chain_id: '0x539',
            environment_type: 'background',
            security_alert_reason: 'NotApplicable',
            security_alert_response: 'NotApplicable',
          });
        },
      );
    });

    it(`${confirmation.name} component includes copyable address element`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await openDapp(driver);

          await clickConfirmationBtnOnTestDapp(
            driver,
            confirmation.testDAppBtnId,
          );
          await clickHeaderInfoBtn(driver);
          await copyAddressAndPasteWalletAddress(driver);

          await assertPastedAddress(driver, WALLET_ADDRESS);
        },
      );
    });

    async function clickConfirmationBtnOnTestDapp(driver, btnId) {
      await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      await driver.clickElement(`#${btnId}`);
      await driver.delay(2000);
    }

    async function clickHeaderInfoBtn(driver) {
      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
      await driver.clickElement('button[data-testid="header-info-button"]');
    }

    async function assertHeaderInfoBalance(driver, walletEthBalance) {
      const headerBalanceEl = await driver.findElement(
        '[data-testid="header-balance"]',
      );
      await driver.waitForNonEmptyElement(headerBalanceEl);
      assert.equal(await headerBalanceEl.getText(), `${walletEthBalance}\nETH`);
    }

    async function copyAddressAndPasteWalletAddress(driver) {
      await driver.clickElement('[data-testid="address-copy-button-text"]');
      await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
      await driver.findElement('#eip747ContractAddress');
      await driver.pasteFromClipboardIntoField('#eip747ContractAddress');
    }

    async function assertPastedAddress(driver, walletAddress) {
      const formFieldEl = await driver.findElement('#eip747ContractAddress');
      assert.equal(await formFieldEl.getProperty('value'), walletAddress);
    }
  });

  async function mockSegment(mockServer) {
    return [
      await mockServer
        .forPost('https://api.segment.io/v1/batch')
        .withJsonBodyIncluding({
          batch: [{ type: 'track', event: 'Signature Requested' }],
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
          };
        }),
      await mockServer
        .forPost('https://api.segment.io/v1/batch')
        .withJsonBodyIncluding({
          batch: [{ type: 'track', event: 'Signature Approved' }],
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
          };
        }),
    ];
  }
});
