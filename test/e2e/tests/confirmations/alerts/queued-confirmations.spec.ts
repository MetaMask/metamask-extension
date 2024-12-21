/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { strict as assert } from 'assert';
import { MockedEndpoint, MockttpServer } from 'mockttp';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { getEventPayloads } from '../../../helpers';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { Driver } from '../../../webdriver/driver';
import {
  createDepositTransaction,
  openDAppWithContract,
  TestSuiteArguments,
} from '../transactions/shared';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';

const FixtureBuilder = require('../../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
} = require('../../../helpers');

const PORT = 8546;
const CHAIN_ID = 1338;
const PORT_ONE = 7777;
const CHAIN_ID_ONE = 1000;

describe('Queued Confirmations', function () {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  describe('Queued Requests Banner Alert', function () {
    it('Banner is shown on dApp 1, but not on dApp 2 after adding transaction on dApp 1, and one on dApp 2 (old confirmation flow)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPreferencesControllerUseRequestQueueEnabled()
            .withSelectedNetworkControllerPerDomain()
            .build(),
          dappOptions: { numberOfDapps: 2 },
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port: PORT,
                chainId: CHAIN_ID,
                ganacheOptions2: defaultGanacheOptions,
              },
              {
                port: PORT_ONE,
                chainId: CHAIN_ID_ONE,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          title: this.test?.fullTitle(),
        },
        async ({ driver }: TestSuiteArguments) => {
          await unlockWallet(driver);

          await connectToDappOne(driver);
          await connectToDappTwoAndSwitchBackToOne(driver);

          await switchChainToDappOne(driver);

          await switchToDAppAndCreateTransactionRequest(driver);
          await switchToDAppTwoAndCreateSignTypedDataRequest(driver);

          await assertBannerExistsOnConfirmation(driver);
          await rejectConfirmation(driver);
          await assertBannerDoesNotExistOnConfirmation(driver);
        },
      );
    });

    it('Banner is shown on dApp 1, but not on dApp 2 after adding multiple transactions on dApp 1, and one on dApp 2', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPreferencesControllerUseRequestQueueEnabled()
            .withSelectedNetworkControllerPerDomain()
            .build(),
          dappOptions: { numberOfDapps: 2 },
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port: PORT,
                chainId: CHAIN_ID,
                ganacheOptions2: defaultGanacheOptions,
              },
              {
                port: PORT_ONE,
                chainId: CHAIN_ID_ONE,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          title: this.test?.fullTitle(),
        },
        async ({ driver }: TestSuiteArguments) => {
          await unlockWallet(driver);

          await connectToDappOne(driver);
          await connectToDappTwoAndSwitchBackToOne(driver);

          await switchChainToDappOne(driver);

          await switchToDAppAndCreateTransactionRequest(driver);
          await switchToDAppAndCreateTransactionRequest(driver);
          await switchToDAppAndCreateTransactionRequest(driver);

          await switchToDAppTwoAndCreateSignTypedDataRequest(driver);

          await assertBannerExistsOnConfirmation(driver);
          await rejectConfirmation(driver);
          await rejectConfirmation(driver);
          await rejectConfirmation(driver);
          await assertBannerDoesNotExistOnConfirmation(driver);
        },
      );
    });

    it('Banner is shown on dApp 1, but not on dApp 2 after adding transaction on dApp 1, and one on dApp 2 (redesigned confirmation flow)', async function () {
      const smartContract = SMART_CONTRACTS.PIGGYBANK;

      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
              useRequestQueue: true,
            })
            .withSelectedNetworkControllerPerDomain()
            .build(),
          dappOptions: { numberOfDapps: 2 },
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port: PORT,
                chainId: CHAIN_ID,
                ganacheOptions2: defaultGanacheOptions,
              },
              {
                port: PORT_ONE,
                chainId: CHAIN_ID_ONE,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);

          await connectToDappTwoAndSwitchBackToOne(driver, contractAddress);

          // create deposit transaction in dapp 1
          await createDepositTransaction(driver);

          await driver.delay(2000);

          await switchToDAppTwoAndCreateSignTypedDataRequest(driver);

          await assertBannerExistsOnConfirmation(driver);
        },
      );
    });
  });

  describe('Navigation and Banner Metrics', function () {
    it('Metric is sent from the nav bar and the banner alert (old confirmation flow)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPreferencesControllerUseRequestQueueEnabled()
            .withSelectedNetworkControllerPerDomain()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          dappOptions: { numberOfDapps: 2 },
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port: PORT,
                chainId: CHAIN_ID,
                ganacheOptions2: defaultGanacheOptions,
              },
              {
                port: PORT_ONE,
                chainId: CHAIN_ID_ONE,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          title: this.test?.fullTitle(),
          testSpecificMock: queueControllerMocks,
        },
        async ({
          driver,
          mockedEndpoint: mockedEndpoints,
        }: TestSuiteArguments) => {
          await unlockWallet(driver);

          await connectToDappOne(driver);
          await connectToDappTwoAndSwitchBackToOne(driver);

          await switchChainToDappOne(driver);

          await switchToDAppAndCreateTransactionRequest(driver);
          await switchToDAppAndCreateTransactionRequest(driver);
          await switchToDAppTwoAndCreateSignTypedDataRequest(driver);

          const events = await getEventPayloads(
            driver,
            mockedEndpoints as MockedEndpoint[],
          );

          assert.equal(events.length, 2);

          assert.equal(
            events[0].event,
            MetaMetricsEventName.ConfirmationQueued,
          );
          assert.equal(events[0].properties.category, 'Confirmations');
          assert.equal(events[0].properties.chain_id, '0x3e8');
          assert.equal(events[0].properties.environment_type, 'notification');
          assert.equal(events[0].properties.locale, 'en');
          assert.equal(events[0].properties.queue_size, 1);
          assert.equal(events[0].properties.queue_type, 'navigation_header');
          assert.equal(events[0].properties.referrer, 'http://127.0.0.1:8080');
          assert.equal(events[0].properties.confirmation_type, 'transaction');

          assert.equal(
            events[1].event,
            MetaMetricsEventName.ConfirmationQueued,
          );
          assert.equal(events[1].properties.category, 'Confirmations');
          assert.equal(events[1].properties.chain_id, '0x3e8');
          assert.equal(events[1].properties.environment_type, 'notification');
          assert.equal(events[1].properties.locale, 'en');
          assert.equal(events[1].properties.queue_size, 1);
          assert.equal(events[1].properties.queue_type, 'queue_controller');
          assert.equal(events[1].properties.referrer, 'http://127.0.0.1:8080');
          assert.equal(events[1].properties.confirmation_type, 'transaction');
        },
      );
    });

    it('Metric is sent from the nav bar and the banner alert (redesigned confirmation flow)', async function () {
      const smartContract = SMART_CONTRACTS.PIGGYBANK;

      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: { redesignedConfirmationsEnabled: true },
              useRequestQueue: true,
            })
            .withSelectedNetworkControllerPerDomain()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          dappOptions: { numberOfDapps: 2 },
          ganacheOptions: {
            ...defaultGanacheOptions,
            concurrent: [
              {
                port: PORT,
                chainId: CHAIN_ID,
                ganacheOptions2: defaultGanacheOptions,
              },
              {
                port: PORT_ONE,
                chainId: CHAIN_ID_ONE,
                ganacheOptions2: defaultGanacheOptions,
              },
            ],
          },
          smartContract,
          title: this.test?.fullTitle(),
          testSpecificMock: queueControllerMocks,
        },
        async ({
          driver,
          contractRegistry,
          mockedEndpoint: mockedEndpoints,
        }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          const contractAddress = await (
            contractRegistry as ContractAddressRegistry
          ).getContractAddress(smartContract);

          await connectToDappTwoAndSwitchBackToOne(driver, contractAddress);

          // create deposit transaction in dapp 1
          await createDepositTransaction(driver);

          await driver.delay(2000);

          await switchToDAppTwoAndCreateSignTypedDataRequest(driver);

          const events = await getEventPayloads(
            driver,
            mockedEndpoints as MockedEndpoint[],
          );

          assert.equal(events.length, 2);

          assert.equal(
            events[0].event,
            MetaMetricsEventName.ConfirmationQueued,
          );
          assert.equal(events[0].properties.category, 'Confirmations');
          assert.equal(events[0].properties.chain_id, '0x539');
          assert.equal(events[0].properties.environment_type, 'notification');
          assert.equal(events[0].properties.locale, 'en');
          assert.equal(events[0].properties.queue_size, 1);
          assert.equal(events[0].properties.queue_type, 'navigation_header');
          assert.equal(events[0].properties.referrer, 'http://127.0.0.1:8080');
          assert.equal(events[0].properties.confirmation_type, 'transaction');

          assert.equal(
            events[1].event,
            MetaMetricsEventName.ConfirmationQueued,
          );
          assert.equal(events[1].properties.category, 'Confirmations');
          assert.equal(events[1].properties.chain_id, '0x539');
          assert.equal(events[1].properties.environment_type, 'notification');
          assert.equal(events[1].properties.locale, 'en');
          assert.equal(events[1].properties.queue_size, 1);
          assert.equal(events[1].properties.queue_type, 'queue_controller');
          assert.equal(events[1].properties.referrer, 'http://127.0.0.1:8080');
          assert.equal(events[1].properties.confirmation_type, 'transaction');
        },
      );
    });
  });
});

async function connectToDappOne(driver: Driver) {
  // Open Dapp One
  await openDapp(driver, undefined, DAPP_URL);

  // Connect to dapp
  await driver.findClickableElement({ text: 'Connect', tag: 'button' });
  await driver.clickElement('#connectButton');

  await driver.delay(regularDelayMs);

  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
}

async function connectToDappTwoAndSwitchBackToOne(
  driver: Driver,
  contractAddress?: string,
) {
  // Open Dapp Two
  await openDapp(driver, undefined, DAPP_ONE_URL);

  // Connect to dapp 2
  await driver.findClickableElement({ text: 'Connect', tag: 'button' });
  await driver.clickElement('#connectButton');

  await driver.delay(regularDelayMs);

  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  const url = `${DAPP_URL}${
    contractAddress ? `/?contract=${contractAddress}` : ''
  }`;

  await driver.switchToWindowWithUrl(url);
}

async function switchChainToDappOne(driver: Driver) {
  // switch chain for Dapp One
  const switchEthereumChainRequest = JSON.stringify({
    jsonrpc: '2.0',
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0x3e8' }],
  });

  // Initiate switchEthereumChain on Dapp one
  await driver.executeScript(
    `window.ethereum.request(${switchEthereumChainRequest})`,
  );

  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.clickElement({ text: 'Switch network', tag: 'button' });
}

async function switchToDAppAndCreateTransactionRequest(driver: Driver) {
  await driver.switchToWindowWithUrl(DAPP_URL);

  // eth_sendTransaction request
  await driver.clickElement('#sendButton');
}

async function switchToDAppTwoAndCreateSignTypedDataRequest(driver: Driver) {
  await driver.switchToWindowWithUrl(DAPP_ONE_URL);

  // signTypedData request
  await driver.clickElement('#signTypedData');
}

const bannerCopy =
  "To view and confirm your most recent request, you'll need to approve or reject existing requests first.";

async function assertBannerExistsOnConfirmation(driver: Driver) {
  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({ css: 'p', text: bannerCopy });
}

async function rejectConfirmation(driver: Driver) {
  await driver.clickElement({ css: 'button', text: 'Reject' });
}

async function assertBannerDoesNotExistOnConfirmation(driver: Driver) {
  await driver.waitUntilXWindowHandles(4);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.assertElementNotPresent({
    css: 'p',
    text: bannerCopy,
  });
}

async function mockedTrackedQueueControllerEvent(mockServer: MockttpServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [
        { type: 'track', event: MetaMetricsEventName.ConfirmationQueued },
      ],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function queueControllerMocks(server: MockttpServer) {
  return [
    await mockedTrackedQueueControllerEvent(server),
    await mockedTrackedQueueControllerEvent(server),
  ];
}
