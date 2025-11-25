import assert from 'node:assert/strict';
import { ACCOUNT_TYPE } from '../../constants';
import {
  WALLET_PASSWORD,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { setManifestFlags } from '../../set-manifest-flags';

type StoredState = Record<string, any>;

const SPLIT_FLAG = { value: { enabled: true } };

const readStorage = async (driver: any) => {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;

    browser.storage.local
      .get(null)
      .then((value) => callback({ value }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(result.error);
  }

  return (result?.value ?? {}) as StoredState;
};

const assertSplitStateStorage = (storage: StoredState) => {
  assert.ok(
    Array.isArray(storage.manifest),
    'manifest should be written in split state storage',
  );
  assert.ok(
    storage.meta?.storageKind === 'split',
    'meta.storageKind should be split',
  );
  assert.ok(!('data' in storage), 'data key should be removed in split state');
  assert.ok(
    storage.manifest.includes('meta'),
    'meta should be part of the manifest',
  );

  for (const key of storage.manifest) {
    assert.ok(
      key === 'manifest' || key in storage,
      `manifest key ${key} should be present in storage`,
    );
  }
};

const assertDataStateStorage = (storage: StoredState) => {
  assert.ok(storage.meta, 'meta should be present in data storage');
  assert.ok('data' in storage, 'data key should be present in data storage');
  assert.ok(
    storage.meta?.storageKind !== 'split',
    'meta.storageKind should not be split for data storage',
  );
};

const reloadExtension = async (driver: any) => {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    browser.runtime.reload();
    callback();
  `);

  await driver.switchToWindow(blankWindow);
};

// Persist the remote flag into stored state so reload sees it during migration.
const ensureSplitFlagPersisted = async (driver: any) => {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;

    browser.storage.local
      .get(['data', 'meta'])
      .then(({ data = {}, meta = {} }) => {
        const controller = data.RemoteFeatureFlagController ?? {};
        const state = controller.state ?? {};
        const flags = state.remoteFeatureFlags ?? {};
        flags.platformSplitStateGradualRollout = ${JSON.stringify(SPLIT_FLAG)};
        controller.state = {
          ...state,
          remoteFeatureFlags: flags,
        };
        data.RemoteFeatureFlagController = controller;
        return browser.storage.local.set({ data, meta });
      })
      .then(() => callback({ ok: true }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(result.error);
  }
};

const buildFlaggedFixture = (fixtureBuilder: FixtureBuilder) => {
  const fixture = fixtureBuilder.build();
  fixture.data.RemoteFeatureFlagController = {
    state: {
      remoteFeatureFlags: {
        platformSplitStateGradualRollout: SPLIT_FLAG,
      },
      cacheTimestamp: 0,
    },
  };
  return fixture;
};

describe('State Persistence', function () {
  this.timeout(120000);

  describe("split state", () => {
    it('should default to the split state storage', async function () {
      const fixtures = buildFlaggedFixture(new FixtureBuilder());

      await withFixtures({ fixtures }, async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const storage = await readStorage(driver);
        assertSplitStateStorage(storage);
      });
    });

    it('should update from data state to split state', async function () {
      const accountName = 'Account 2';

      await withFixtures({ fixtures: new FixtureBuilder().build() }, async ({
        driver,
      }) => {
        await loginWithBalanceValidation(driver);

        let storage = await readStorage(driver);
        assertDataStateStorage(storage);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
          accountName,
        });
        await accountListPage.checkAccountDisplayedInAccountList(accountName);
        await accountListPage.closeAccountModal();

        storage = await readStorage(driver);
        assertDataStateStorage(storage);

        await setManifestFlags({
          remoteFeatureFlags: {
            platformSplitStateGradualRollout: SPLIT_FLAG,
          },
        });
        await ensureSplitFlagPersisted(driver);
        await reloadExtension(driver);
        await unlockWallet(driver, {
          password: WALLET_PASSWORD,
        });

        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountDisplayedInAccountList(accountName);
        await accountListPage.closeAccountModal();

        storage = await readStorage(driver);
        assertSplitStateStorage(storage);

        await reloadExtension(driver);
        await unlockWallet(driver, { password: WALLET_PASSWORD });

        await headerNavbar.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();
        await accountListPage.checkAccountDisplayedInAccountList(accountName);
        await accountListPage.closeAccountModal();

        storage = await readStorage(driver);
        assertSplitStateStorage(storage);
      });
    });

    it('should not attempt to update if an update attempt fails', async function () {
      const fixtureBuilder = new FixtureBuilder();
      const fixtures = buildFlaggedFixture(fixtureBuilder);
      fixtures.meta._platformSplitStateGradualRolloutAttempted = true;

      await withFixtures({ fixtures }, async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const storage = await readStorage(driver);
        assertDataStateStorage(storage);
        assert.equal(
          storage.meta._platformSplitStateGradualRolloutAttempted,
          true,
        );
      });
    });
  });
});
