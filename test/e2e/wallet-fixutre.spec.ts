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

        // run script to export state
        const persistedState = await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        );

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
