import { privateToAddress } from 'ethereumjs-util';
import FixtureBuilder from '../fixture-builder';
import {
  PRIVATE_KEY,
  PRIVATE_KEY_TWO,
  WINDOW_TITLES,
  clickSignOnSignatureConfirmation,
  switchToOrOpenDapp,
  unlockWallet,
  validateContractDetails,
  multipleGanacheOptions,
  regularDelayMs,
} from '../helpers';
import { Driver } from '../webdriver/driver';
import { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } from '../constants';
import { retry } from '../../../development/lib/retry';

/**
 * These are fixtures specific to Account Snap E2E tests:
 * -- connected to Test Dapp
 * -- eth_sign enabled
 * -- two private keys with 25 ETH each
 *
 * @param title
 */
export const accountSnapFixtures = (title: string | undefined) => {
  return {
    dapp: true,
    fixtures: new FixtureBuilder()
      .withPermissionControllerConnectedToTestDapp(false)
      .withPreferencesController({
        disabledRpcMethodPreferences: {
          eth_sign: true,
        },
      })
      .build(),
    ganacheOptions: multipleGanacheOptions,
    title,
  };
};

// convert PRIVATE_KEY to public key
export const PUBLIC_KEY = privateToAddress(
  Buffer.from(PRIVATE_KEY.slice(2), 'hex'),
).toString('hex');

export async function installSnapSimpleKeyring(
  driver: Driver,
  isAsyncFlow: boolean,
) {
  await unlockWallet(driver);

  // navigate to test Snaps page and connect
  await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
  await driver.clickElement('#connectButton');

  await driver.delay(500);

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.delay(500);

  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });

  await driver.findElement({ text: 'Installation request', tag: 'h2' });

  await driver.clickElementSafe('[data-testid="snap-install-scroll"]', 200);

  await driver.waitForSelector({ text: 'Install' });

  await driver.clickElement({
    text: 'Install',
    tag: 'button',
  });

  await driver.waitForSelector({ text: 'OK' });

  await driver.clickElement({
    text: 'OK',
    tag: 'button',
  });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  await driver.waitForSelector({
    text: 'Connected',
    tag: 'span',
  });

  if (isAsyncFlow) {
    await toggleAsyncFlow(driver);
  }
}

async function toggleAsyncFlow(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  await driver.clickElement('[data-testid="use-sync-flow-toggle"]');
}

export async function importKeyAndSwitch(driver: Driver) {
  await driver.clickElement({
    text: 'Import account',
    tag: 'div',
  });

  await driver.fill('#import-account-private-key', PRIVATE_KEY_TWO);

  await driver.clickElement({
    text: 'Import Account',
    tag: 'button',
  });

  // Click "Create" on the Snap's confirmation popup
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({
    css: '[data-testid="confirmation-submit-button"]',
    text: 'Create',
  });
  await driver.clickElement({
    css: '[data-testid="confirmation-submit-button"]',
    text: 'Ok',
  });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  await switchToAccount2(driver);
}

export async function makeNewAccountAndSwitch(driver: Driver) {
  await driver.clickElement({
    text: 'Create account',
    tag: 'div',
  });

  await driver.clickElement({
    text: 'Create Account',
    tag: 'button',
  });

  // Click "Create" on the Snap's confirmation popup
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({
    css: '[data-testid="confirmation-submit-button"]',
    text: 'Create',
  });
  await driver.clickElement({
    css: '[data-testid="confirmation-submit-button"]',
    text: 'Ok',
  });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  const newPublicKey = await (
    await driver.findElement({
      text: '0x',
      tag: 'p',
    })
  ).getText();

  await switchToAccount2(driver);

  return newPublicKey;
}

async function switchToAccount2(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // click on Accounts
  await driver.clickElement('[data-testid="account-menu-icon"]');

  await driver.clickElement({
    tag: 'Button',
    text: 'Snap Account 1',
  });

  await driver.assertElementNotPresent({
    tag: 'header',
    text: 'Select an account',
  });
}

export async function connectAccountToTestDapp(driver: Driver) {
  await switchToOrOpenDapp(driver);
  await driver.clickElement('#connectButton');

  await driver.delay(regularDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
}

export async function disconnectFromTestDapp(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement('[data-testid="global-menu-connected-sites"]');
  await driver.clickElement({ text: 'Disconnect', tag: 'a' });
  await driver.clickElement({ text: 'Disconnect', tag: 'button' });
}

export async function approveOrRejectRequest(driver: Driver, flowType: string) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.SnapSimpleKeyringDapp);

  await driver.clickElementUsingMouseMove({
    text: 'List requests',
    tag: 'div',
  });

  await driver.clickElement({
    text: 'List Requests',
    tag: 'button',
  });

  // get the JSON from the screen
  const requestJSON = await (
    await driver.findElement({
      text: '"scope": "",',
      tag: 'div',
    })
  ).getText();

  const requestID = JSON.parse(requestJSON)[0].id;

  if (flowType === 'approve') {
    await driver.clickElementUsingMouseMove({
      text: 'Approve request',
      tag: 'div',
    });

    await driver.fill('#approve-request-request-id', requestID);

    await driver.clickElement({
      text: 'Approve Request',
      tag: 'button',
    });
  } else if (flowType === 'reject') {
    await driver.clickElementUsingMouseMove({
      text: 'Reject request',
      tag: 'div',
    });

    await driver.fill('#reject-request-request-id', requestID);

    await driver.clickElement({
      text: 'Reject Request',
      tag: 'button',
    });
  }

  // Close the SnapSimpleKeyringDapp, so that 6 of the same tab doesn't pile up
  await driver.closeWindow();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
}

export async function signData(
  driver: Driver,
  locatorID: string,
  newPublicKey: string,
  flowType: string,
) {
  const isAsyncFlow = flowType !== 'sync';

  // This step can frequently fail, so retry it
  await retry(
    {
      retries: 3,
      delay: 2000,
    },
    async () => {
      await switchToOrOpenDapp(driver);

      await driver.clickElement(locatorID);

      // take extra time to load the popup
      await driver.delay(500);

      await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    },
  );

  // these three don't have a contract details page
  if (!['#ethSign', '#personalSign', '#signTypedData'].includes(locatorID)) {
    await validateContractDetails(driver);
  }

  await clickSignOnSignatureConfirmation(driver, 3, locatorID);

  if (isAsyncFlow) {
    await driver.delay(2000);

    // This step can frequently fail, so retry it
    await retry(
      {
        retries: 3,
        delay: 1000,
      },
      async () => {
        // Navigate to the Notification window and click 'Go to site' button
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Go to site',
          tag: 'button',
        });
      },
    );

    await driver.delay(1000);
    await approveOrRejectRequest(driver, flowType);
  }

  await driver.delay(500);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  if (flowType === 'sync' || flowType === 'approve') {
    if (locatorID === '#ethSign') {
      // there is no Verify button for #ethSign
      await driver.findElement({
        css: '#ethSignResult',
        text: '0x', // we are just making sure that it contains ANY hex value
      });
    } else {
      await driver.clickElement(`${locatorID}Verify`);

      const resultLocator =
        locatorID === '#personalSign'
          ? '#personalSignVerifyECRecoverResult' // the verify span IDs are different with Personal Sign
          : `${locatorID}VerifyResult`;

      await driver.findElement({
        css: resultLocator,
        text: newPublicKey.toLowerCase(),
      });
    }
  } else if (flowType === 'reject') {
    // ensure the transaction was rejected by the Snap
    await driver.findElement({
      text: 'Error: Request rejected by user or snap.',
    });
  }
}
