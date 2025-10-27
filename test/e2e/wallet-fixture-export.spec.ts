import path from 'path';
import fs from 'fs-extra';
import { WINDOW_TITLES, withFixtures } from './helpers';

describe('Wallet State', function () {
  it('export onboarding fixture', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // we don't need to use navigate since MM will automatically open a new window in prod build
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // wait for a non-empty persisted state
        await driver.waitUntil(
          async () => {
            const state = await driver.executeScript(
              'return window.stateHooks.getPersistedState()',
            );
            if (typeof state?.data !== 'object') {
              return false;
            }
            const dataKeys = Object.keys(state.data).filter(
              (k) => k !== 'config',
            );
            return dataKeys.length > 0;
          },
          { interval: 1000, timeout: 10000 },
        );

        const persistedState = await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        );

        console.log('persistedState', persistedState);

        const outDir = path.resolve(
          process.cwd(),
          'test-artifacts',
          'onboarding-fixture',
        );
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'onboarding-fixture.json');
        await fs.writeJson(outPath, persistedState, { spaces: 2 });
      },
    );
  });
});
