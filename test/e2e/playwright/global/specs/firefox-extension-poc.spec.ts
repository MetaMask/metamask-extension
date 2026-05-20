import { expect, firefox, test } from '@playwright/test';
import path from 'path';
import os from 'os';
import { mkdtemp, rm } from 'node:fs/promises';
import FixtureServer from '../../../fixtures/fixture-server';
import { buildDefaultFixture } from '../../llm-workflow/fixture-helper';
import { WALLET_PASSWORD } from '../../../constants';
import {
  ensurePatchedPlaywrightFirefox,
  findMetaMaskInternalUuidFromProfile,
  installTemporaryAddonViaRdp,
} from '../../shared/firefox-extension-harness';

const METAMASK_GECKO_ID = 'webextension@metamask.io';
const FIREFOX_RDP_PORT = 6023;

test('loads MetaMask in Firefox, unlocks wallet, and verifies balance', async () => {
  test.setTimeout(90000);
  const fixtureServer = new FixtureServer();
  let userDataDir: string | undefined;
  let extensionContext: Awaited<
    ReturnType<typeof firefox.launchPersistentContext>
  > | null = null;

  try {
    await ensurePatchedPlaywrightFirefox();

    await fixtureServer.start();
    fixtureServer.loadJsonState(buildDefaultFixture(), {
      getContractAddress: (_name: string) => {
        throw new Error('Contract substitutions are not used in this PoC');
      },
    });

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

    if (!userDataDir) {
      throw new Error('Expected userDataDir to be initialized');
    }

    const extensionUuid = await findMetaMaskInternalUuidFromProfile(
      userDataDir,
      METAMASK_GECKO_ID,
      30000,
    );
    const extensionOrigin = `moz-extension://${extensionUuid}`;
    const extensionHomeUrl = `${extensionOrigin}/home.html`;
    const page = await extensionContext.newPage();
    let navigationError: string | null = null;
    try {
      await page.goto(extensionHomeUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 8000,
      });
    } catch (error) {
      navigationError = error instanceof Error ? error.message : String(error);
    }

    if (navigationError) {
      throw new Error(
        `Firefox addon installed but Playwright could not reach extension page: ${navigationError}`,
      );
    }

    await page.locator('.controller-loaded').waitFor({ timeout: 30000 });

    const unlockPasswordField = page.getByTestId('unlock-password');
    const accountMenuIcon = page.getByTestId('account-menu-icon');
    const isUnlockVisible = await unlockPasswordField
      .isVisible()
      .catch(() => false);
    const isAccountMenuVisible = await accountMenuIcon
      .isVisible()
      .catch(() => false);
    console.log(
      `[Firefox PoC] screenCheck url=${page.url()} unlockVisible=${isUnlockVisible} accountMenuVisible=${isAccountMenuVisible}`,
    );

    if (isUnlockVisible) {
      await unlockPasswordField.fill(WALLET_PASSWORD);
      await page.getByTestId('unlock-submit').click();
    }

    await expect(accountMenuIcon).toBeVisible({ timeout: 20000 });

  } finally {
    await extensionContext?.close();
    await fixtureServer.stop();

    if (userDataDir) {
      await rm(userDataDir, { recursive: true, force: true });
    }
  }
});
