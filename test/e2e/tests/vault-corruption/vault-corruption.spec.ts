import assert from 'node:assert/strict';
import { withFixtures } from '../../helpers';
import { PAGES, type Driver } from '../../webdriver/driver';
import {
  clickRecover,
  onboardThenTriggerCorruption,
  getConfig,
  onboard,
  onboardAfterRecovery,
  getFirstAddress,
} from './helpers';

describe('Vault Corruption', function () {
  this.timeout(120000); // This test is very long, so we need an unusually high timeout

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
        const initialFirstAddress = await onboardThenTriggerCorruption(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        // start recovery
        await clickRecover({ driver, confirm: true });

        // onboard again
        const restoredFirstAddress = await onboardAfterRecovery(driver);

        // make sure the address is the same as before
        assert.equal(
          restoredFirstAddress,
          initialFirstAddress,
          'Addresses should match',
        );
      },
    );
  });

  it('resets metamask state when both primary and backup databases are broken', async function () {
    await withFixtures(
      getConfig(this.test?.title),
      async ({ driver }: { driver: Driver }) => {
        const initialFirstAddress = await onboardThenTriggerCorruption(
          driver,
          breakAllDatabasesScript('KeyringController'),
        );

        // start reset
        await clickRecover({ driver, confirm: true });

        // Now onboard again, like a first-time user :-(
        await onboard(driver);

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
        const initialFirstAddress = await onboardThenTriggerCorruption(
          driver,
          breakPrimaryDatabaseOnlyScript,
        );

        // click recover but dismiss the prompt
        await clickRecover({ driver, confirm: false });
        // make sure the button can be clicked yet again; dismiss again
        await clickRecover({ driver, confirm: false });

        // reload to make sure the UI is still in the same Vault Corrupted state
        await driver.navigate(PAGES.HOME, {
          waitForControllers: false,
        });

        // make sure the button can be clicked yet again; dismiss the prompt
        await clickRecover({ driver, confirm: false });
        // actually recover the vault this time just to make sure
        // it all still works after dismissing the prompt previously
        await clickRecover({ driver, confirm: true });

        // verify that the UI has completed recovery this time
        const restoredFirstAddress = await onboardAfterRecovery(driver);
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
        const initialFirstAddress = await onboardThenTriggerCorruption(
          driver,
          breakAllDatabasesScript('meta'),
        );

        // start recovery
        await clickRecover({ driver, confirm: true });

        // onboard again
        const restoredFirstAddress = await onboardAfterRecovery(driver);

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
