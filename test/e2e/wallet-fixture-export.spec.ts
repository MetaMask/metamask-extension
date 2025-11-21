import path from 'path';
import fs from 'fs-extra';
import { WINDOW_TITLES, withFixtures } from './helpers';
import StartOnboardingPage from './page-objects/pages/onboarding/start-onboarding-page';

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
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

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
          'test',
          'e2e',
          'fixtures',
        );
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'onboarding-fixture.json');
        console.log(
          '\n=============================================================================\n',
        );
        console.log('📁 WALLET FIXTURE STATE EXPORT');
        console.log(
          '=============================================================================\n',
        );
        console.log(`📂 Output directory: ${outDir}`);
        console.log(`📄 Output file: ${outPath}`);
        console.log(
          '=============================================================================\n',
        );

        await fs.writeJson(outPath, persistedState, { spaces: 2 });
      },
    );
  });
});
