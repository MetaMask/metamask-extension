import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { MetaMetricsRequestedThrough } from '../../../../shared/constants/metametrics';
import {
  MOCK_ANALYTICS_ID,
  MOCK_PROFILE_IDENTITY_EVENT_PROPERTIES,
  WINDOW_TITLES,
} from '../../constants';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import DecryptMessageConfirmation from '../../page-objects/pages/confirmations/decrypt-message-confirmation';
import GetEncryptionKeyConfirmation from '../../page-objects/pages/confirmations/get-encryption-key-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';
import {
  decryptMessageAndVerifyResult,
  getEncryptionKeyInDapp,
} from '../../page-objects/flows/encrypt-decrypt.flow';

/**
 * Mocks the Segment API for encryption/decryption event names we expect.
 * Do not use the constants from the metrics constants files, because if these
 * change we want a strong indicator to our data team that the shape of data
 * will change.
 *
 * @param mockServer - The mock server instance.
 * @param eventNames - Event names to mock.
 * @returns Array of mocked endpoints.
 */
async function mockSegment(mockServer: Mockttp, eventNames: string[]) {
  return Promise.all(
    eventNames.map((eventName) =>
      mockServer
        .forPost('https://api.segment.io/v1/batch')
        .withJsonBodyIncluding({
          batch: [{ type: 'track', event: eventName }],
        })
        .thenCallback(() => {
          return {
            statusCode: 200,
          };
        }),
    ),
  );
}

const expectedEncryptionEventProperties = {
  method: 'eth_getEncryptionPublicKey',
  category: 'inpage_provider',
  locale: 'en',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chain_id: '0x539',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  environment_type: 'background',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  api_source: MetaMetricsRequestedThrough.EthereumProvider,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  is_iframe: false,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  is_cross_origin_iframe: false,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  iframe_origin: null,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  top_level_origin: null,
  ...MOCK_PROFILE_IDENTITY_EVENT_PROPERTIES,
};

const expectedDecryptionEventProperties = {
  ...expectedEncryptionEventProperties,
  method: 'eth_decrypt',
};

describe('Encrypt Decrypt', function (this: Suite) {
  const encryptionKey = 'fxYXfCbun026g5zcCQh7Ia+O0urAEVZWLG8H4Jzu7Xs=';
  const message = 'Hello, Bob!';

  it('should decrypt an encrypted message and track encryption/decryption events', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) =>
          mockSegment(mockServer, [
            'Encryption Requested',
            'Encryption Approved',
            'Decryption Requested',
            'Decryption Approved',
          ]),
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // ------ Get Encryption key ------
        await getEncryptionKeyInDapp(driver, encryptionKey);

        // ------ Encrypt message ------
        await testDapp.encryptMessage(message);

        // ------ Decrypt message and verify the result ------
        await decryptMessageAndVerifyResult(driver, message);

        // ------ Verify decrypted message in Test Dapp ------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await testDapp.checkDecryptedMessage(message);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 4);
        assert.equal(events[0].event, 'Encryption Requested');
        assert.deepStrictEqual(
          events[0].properties,
          expectedEncryptionEventProperties,
        );
        assert.equal(events[1].event, 'Encryption Approved');
        assert.deepStrictEqual(
          events[1].properties,
          expectedEncryptionEventProperties,
        );
        assert.equal(events[2].event, 'Decryption Requested');
        assert.deepStrictEqual(
          events[2].properties,
          expectedDecryptionEventProperties,
        );
        assert.equal(events[3].event, 'Decryption Approved');
        assert.deepStrictEqual(
          events[3].properties,
          expectedDecryptionEventProperties,
        );
      },
    );
  });

  it('should track Encryption Requested and Cancel when user cancels encryption public key request', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) =>
          mockSegment(mockServer, [
            'Encryption Requested',
            // Cancel is the legacy UI event fired on reject. Encryption Rejected
            // is not emitted today because cancel does not return EIP-1193 4001.
            'Cancel',
          ]),
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await testDapp.clickGetEncryptionKeyButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const getEncryptionKeyConfirmation = new GetEncryptionKeyConfirmation(
          driver,
        );
        await getEncryptionKeyConfirmation.checkPageIsLoaded();
        await getEncryptionKeyConfirmation.clickToCancelProvideEncryptionKey();

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 2);
        assert.equal(events[0].event, 'Encryption Requested');
        assert.deepStrictEqual(
          events[0].properties,
          expectedEncryptionEventProperties,
        );
        assert.equal(events[1].event, 'Cancel');
        assert.equal(events[1].properties.category, 'Messages');
        assert.equal(
          events[1].properties.action,
          'Encryption public key Request',
        );
        assert.equal(events[1].properties.legacy_event, true);
      },
    );
  });

  it('should encrypt and decrypt multiple messages', async function () {
    const message2 = 'Hello, Alice!';
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // ------ Get Encryption key ------
        await getEncryptionKeyInDapp(driver, encryptionKey);

        // ------ Encrypt Message 1------
        await testDapp.encryptMessage(message);

        // ------ Decrypt Message 1 on test dapp------
        await testDapp.clickDecryptButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const decryptMessageConfirmation = new DecryptMessageConfirmation(
          driver,
        );
        await decryptMessageConfirmation.checkPageIsLoaded();

        // ------ Encrypt Message 2 ------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await testDapp.encryptMessage(message2);

        // ------ Decrypt Message 1 on test dapp and verify the result------
        await decryptMessageAndVerifyResult(driver, message);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await testDapp.checkDecryptedMessage(message);

        // ------ Decrypt Message 2 on and verify the result------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await decryptMessageConfirmation.checkPageIsLoaded();
        await decryptMessageConfirmation.clickDecryptMessageButton();
        await decryptMessageConfirmation.checkDecryptedMessage(message2);
        await decryptMessageConfirmation.clickToConfirmDecryptMessage();

        // ------ Verify decrypted message 2 in Test Dapp ------
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        await testDapp.checkDecryptedMessage(message2);
      },
    );
  });
});
