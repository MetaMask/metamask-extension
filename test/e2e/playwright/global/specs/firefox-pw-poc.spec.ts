import { firefox, test } from '@playwright/test';
import path from 'path';
import os from 'os';
import { mkdtemp, rm } from 'node:fs/promises';
import FixtureServer from '../../../fixtures/fixture-server';
import { buildDefaultFixture } from '../../llm-workflow/fixture-helper';
import { HomePage } from '../../../page-objects/pages/home/homepage';
import { WALLET_PASSWORD } from '../../../constants';
import {
  ensurePatchedPlaywrightFirefox,
  findMetaMaskInternalUuidFromProfile,
  installTemporaryAddonViaRdp,
} from '../../shared/firefox-extension-harness';

const METAMASK_GECKO_ID = 'webextension@metamask.io';
const FIREFOX_RDP_PORT = 6023;

async function withFixtures(testSuite: () => Promise<void>) {
  const fixtureServer = new FixtureServer();
  await fixtureServer.start();
  fixtureServer.loadJsonState(buildDefaultFixture(), {
    getContractAddress: (_name: string) => {
      throw new Error('Contract substitutions are not used in this PoC');
    },
  });

  try {
    await testSuite();
  } finally {
    await fixtureServer.stop();
  }
}

test('loads MetaMask in Firefox, unlocks wallet, and verifies balance', async () => {
  test.setTimeout(90000);

  await withFixtures(async () => {
    let userDataDir: string | undefined;
    let extensionContext: Awaited<
      ReturnType<typeof firefox.launchPersistentContext>
    > | null = null;

    try {
      await ensurePatchedPlaywrightFirefox();
      userDataDir = await mkdtemp(path.join(os.tmpdir(), 'mm-pw-firefox-poc-'));

      extensionContext = await firefox.launchPersistentContext(userDataDir, {
        headless: Boolean(process.env.CI),
        args: ['-start-debugger-server', String(FIREFOX_RDP_PORT)],
        firefoxUserPrefs: {
          'devtools.debugger.remote-enabled': true,
          'devtools.debugger.prompt-connection': false,
        },
      });

      await installTemporaryAddonViaRdp({
        port: FIREFOX_RDP_PORT,
        addonPath: path.join(process.cwd(), 'dist', 'firefox'),
      });

      const extensionUuid = await findMetaMaskInternalUuidFromProfile(
        userDataDir,
        METAMASK_GECKO_ID,
        30000,
      );
      const extensionHomeUrl = `moz-extension://${extensionUuid}/home.html`;

      const [page] = extensionContext.pages();
      await page.goto(extensionHomeUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 8000,
      });

      for (const contextPage of extensionContext.pages()) {
        if (contextPage !== page) {
          await contextPage.close();
        }
      }

      await page.locator('.controller-loaded').waitFor({ timeout: 30000 });

      const unlockPasswordField = page.getByTestId('unlock-password');
      if (await unlockPasswordField.isVisible().catch(() => false)) {
        await unlockPasswordField.fill(WALLET_PASSWORD);
        await page.getByTestId('unlock-submit').click();
      }

    } finally {
      await extensionContext?.close();

      if (userDataDir) {
        await rm(userDataDir, { recursive: true, force: true });
      }
    }
  });
});
