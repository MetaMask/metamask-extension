import assert from 'node:assert/strict';
import { MockedEndpoint, MockttpServer } from 'mockttp';
import { MISSING_VAULT_ERROR } from '../../../../shared/constants/errors';
import { WALLET_PASSWORD } from '../../constants';
import { sentryRegEx, withFixtures } from '../../helpers';
import { PAGES, type Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  completeVaultRecoveryOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import {
  getFirstAddress,
  onboardThenTriggerCorruptionFlow,
} from '../../page-objects/flows/vault-corruption.flow';
import VaultRecoveryPage from '../../page-objects/pages/vault-recovery-page';
import { getConfig } from './helpers';

describe('Vault Corruption', function () {
  this.timeout(120000); // This test is very long, so we need an unusually high timeout

  const WAIT_FOR_SENTRY_MS = 10000;

  /**
   * Script template to simulate a broken database.
   *
   * @param code - The code to run after the primary database has been broken.
   */
  const createCorruptionScript = (code: string) => `
    // callback is injected by Selenium
    const callback = arguments[arguments.length - 1];

    // browser and chrome are NOT scuttled in test builds, so we can use them
    // to access the storage API here
    const browser = globalThis.browser ?? globalThis.chrome;

    // corrupt the primary database by deleting the KeyringController key
    browser.storage.local.set({ KeyringController: null }, () => {
      ${code}
    });
`;

  /**
   * Common code to reload the extension; used by both the primary and backup
   * database corruption scripts.
   */
  const reloadAndCallbackScript = `
    // TODO: should this be a safe reload via the WriteManager?
    browser.runtime.reload();
    callback();
  `;

  /**
   * Script to break the primary database only.
   */
  const breakPrimaryDatabaseOnlyScript = createCorruptionScript(
    reloadAndCallbackScript,
  );

  /**
   * Script to retrieve the encrypted vault from the backup database.
   */
  const getBackupVaultScript = `
    const callback = arguments[arguments.length - 1];
    const request = globalThis.indexedDB.open('metamask-backup', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('store', 'readonly');
      const store = transaction.objectStore('store');
      const getRequest = store.get('KeyringController');
      getRequest.onsuccess = () => {
        const keyringController = getRequest.result;
        callback(keyringController?.vault ?? null);
      };
      getRequest.onerror = () => callback(null);
    };
    request.onerror = () => callback(null);
  `;

  async function mockSentryMissingVaultError(
    mockServer: MockttpServer,
  ): Promise<MockedEndpoint> {
    return await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding('{"type":"event"')
      .withBodyIncluding(MISSING_VAULT_ERROR)
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

  /**
   * Script to break both the primary and backup databases.
   *
   * @param backupKeyToDelete - The key to delete from the backup database.
   */
  const breakAllDatabasesScript = (
    backupKeyToDelete: 'meta' | 'KeyringController',
  ) => {
    return createCorruptionScript(`
      // indexedDB is not scuttled in test builds, so we can use it to access the
      // backup database here
      const request = globalThis.indexedDB.open('metamask-backup', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('store', { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('store', 'readwrite');
        const store = transaction.objectStore('store');
        // remove the ${backupKeyToDelete} data from the backup database
        store.delete(${JSON.stringify(backupKeyToDelete)});
        transaction.oncomplete = () => {
          ${reloadAndCallbackScript}
        };
      };`);
  };

  it('recovers metamask vault when primary database is broken but backup is intact', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenTriggerCorruptionFlow(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        // start recovery
        const vaultRecoveryPage = new VaultRecoveryPage(driver);
        await vaultRecoveryPage.clickRecoveryButton({ confirm: true });

        // onboard again
        await completeVaultRecoveryOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
        });
        const restoredFirstAddress = await getFirstAddress(driver);

        // make sure the address is the same as before
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });

  it('does not serialize backup data in Sentry captureException payload', async function () {
    const config = getConfig(this.test?.title);
    await withFixtures(
      {
        ...config,
        manifestFlags: {
          ...config.manifestFlags,
        },
        testSpecificMock: mockSentryMissingVaultError,
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint;
      }) => {
        await onboardThenTriggerCorruptionFlow(
          driver,
          breakPrimaryDatabaseOnlyScript,
          {
            participateInMetaMetrics: true,
          },
        );

        const backupVault =
          await driver.executeAsyncScript(getBackupVaultScript);
        assert.ok(backupVault, 'Expected backup vault to exist');

        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, WAIT_FOR_SENTRY_MS);

        const [mockedRequest] = await mockedEndpoint.getSeenRequests();
        const mockTextBody = ((await mockedRequest.body.getText()) ?? '').split(
          '\n',
        );
        const mockJsonBody = JSON.parse(mockTextBody[2]);
        const mockPayload = JSON.stringify(mockJsonBody);
        const escapedBackupVault = JSON.stringify(backupVault).slice(1, -1);

        // check both escaped and unescaped versions of the vault
        assert.equal(
          mockPayload.includes(backupVault) ||
            mockPayload.includes(escapedBackupVault),
          false,
          'Expected Sentry payload to exclude backup vault data',
        );

        // in case the formatting double sure, check one of the vault property
        // keys
        assert.equal(
          mockPayload.includes('keyMetadata'),
          false,
          'Expected Sentry payload to exclude vault property',
        );
        // make sure `keyMetadata` is a real property and we aren't using it in
        // our test for no reason
        assert.equal(
          backupVault.includes('keyMetadata'),
          true,
          'Expected backup vault to include vault property',
        );
      },
    );
  });

  it('resets metamask state when both primary and backup databases are broken', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenTriggerCorruptionFlow(
          driver,
          breakAllDatabasesScript('KeyringController'),
        );

        // start reset
        const vaultRecoveryPage = new VaultRecoveryPage(driver);
        await vaultRecoveryPage.clickRecoveryButton({ confirm: true });

        // Now onboard again, like a first-time user :-(
        await completeCreateNewWalletOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
          skipSRPBackup: true,
        });

        // make sure the account is different than the first time we onboarded
        const newFirstAddress = await getFirstAddress(driver);
        assert.notEqual(
          newFirstAddress,
          initialFirstAddress,
          'Addresses should differ',
        );
      },
    );
  });

  it('does *not* reset metamask state when recovery is *not* confirmed', async function () {
    // The `recovers metamask vault when primary database is broken but backup
    // is intact` test verifies that *first* attempts at recovery work, this
    // test verifies that not recovering, then trying to recovering again later
    // works too.
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenTriggerCorruptionFlow(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        const vaultRecoveryPage = new VaultRecoveryPage(driver);

        // click recover but dismiss the prompt
        await vaultRecoveryPage.clickRecoveryButton({ confirm: false });
        // make sure the button can be clicked yet again; dismiss again
        await vaultRecoveryPage.clickRecoveryButton({ confirm: false });

        // reload to make sure the UI is still in the same Vault Corrupted state
        await driver.navigate(PAGES.HOME, {
          waitForControllers: false,
        });

        // make sure the button can be clicked yet again; dismiss the prompt
        await vaultRecoveryPage.clickRecoveryButton({ confirm: false });
        // actually recover the vault this time just to make sure
        // it all still works after dismissing the prompt previously
        await vaultRecoveryPage.clickRecoveryButton({ confirm: true });

        // verify that the UI has completed recovery this time
        await completeVaultRecoveryOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
        });
        const restoredFirstAddress = await getFirstAddress(driver);
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });

  it('restores a backup that is missing its `meta` property successfully', async function () {
    // this test will run all migrations
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenTriggerCorruptionFlow(
          driver,
          breakAllDatabasesScript('meta'),
        );

        // start recovery
        const vaultRecoveryPage = new VaultRecoveryPage(driver);
        await vaultRecoveryPage.clickRecoveryButton({ confirm: true });

        // onboard again
        await completeVaultRecoveryOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
        });
        const restoredFirstAddress = await getFirstAddress(driver);

        // make sure the address is the same as before
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });
});
