import { Driver } from '../webdriver/driver';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../helpers';
import { mockSignatureInsightsSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, DAPP_ONE_URL, DAPP_URL, WINDOW_TITLES } from '../constants';

describe('Test Snap Signature Insights', function () {
  it('tests Signature Insights functionality', async function () {
    await withFixtures(
      {
        dappOptions: {
          numberOfTestDapps: 1,
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        failOnConsoleError: false,
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockSignatureInsightsSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectSignatureInsightsButton',
          { url: DAPP_ONE_URL },
        );

        await driver.openNewPage(DAPP_URL);

        await driver.findElement('#personalSign');
        await driver.scrollToElement(await driver.findElement('#personalSign'));
        await driver.clickElement('#personalSign');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          text: 'Example `personal_sign` message',
          tag: 'p',
        });
        await driver.waitForSelector({
          text: '0x4578616d706c652060706572736f6e616c5f7369676e60206d657373616765',
          tag: 'p',
        });
        await driver.clickElementSafe('[aria-label="Scroll down"]');
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-footer-button"]',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          text: '0xa10b6707dd79e2f1f91ba243ab7abe15a46f58b052ad9cec170c5366ef5667c447a87eba2c0a9d4c9fbfa0a23e9db1fb55865d0568c32bd7cc681b8d0860e7af1b',
          tag: 'span',
        });

        await driver.findElement('#signTypedData');
        await driver.scrollToElement(
          await driver.findElement('#signTypedData'),
        );
        await driver.clickElement('#signTypedData');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Hi, Alice!', tag: 'p' });
        await driver.clickElementSafe('[aria-label="Scroll down"]');
        await driver.delay(500);
        await driver.waitForSelector({ text: '1', tag: 'p' });
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-footer-button"]',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          text: '0x32791e3c41d40dd5bbfb42e66cf80ca354b0869ae503ad61cd19ba68e11d4f0d2e42a5835b0bfd633596b6a7834ef7d36033633a2479dacfdb96bda360d51f451b',
          tag: 'span',
        });

        await driver.findElement('#signTypedDataV3');
        await driver.scrollToElement(
          await driver.findElement('#signTypedDataV3'),
        );
        await driver.clickElement('#signTypedDataV3');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElementSafe('[aria-label="Scroll down"]');
        await driver.delay(500);
        await driver.waitForSelector({ text: 'Hello, Bob!', tag: 'p' });
        await driver.clickElementSafe('[aria-label="Scroll down"]');
        await driver.delay(500);
        await driver.waitForSelector({
          text: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC has been identified as a malicious verifying contract.',
          tag: 'p',
        });
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-footer-button"]',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          text: '0x0a22f7796a2a70c8dc918e7e6eb8452c8f2999d1a1eb5ad714473d36270a40d6724472e5609948c778a07216bd082b60b6f6853d6354c731fd8ccdd3a2f4af261b',
          tag: 'span',
        });

        await driver.findElement('#signTypedDataV4');
        await driver.scrollToElement(
          await driver.findElement('#signTypedDataV4'),
        );
        await driver.clickElement('#signTypedDataV4');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElementSafe('[aria-label="Scroll down"]');
        await driver.delay(500);
        await driver.waitForSelector({ text: 'Hello, Bob!', tag: 'p' });
        await driver.clickElementSafe('[aria-label="Scroll down"]');
        await driver.delay(500);
        await driver.waitForSelector({
          text: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC has been identified as a malicious verifying contract.',
          tag: 'p',
        });
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirm-footer-button"]',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          text: '0xcd2f9c55840f5e1bcf61812e93c1932485b524ca673b36355482a4fbdf52f692684f92b4f4ab6f6c8572dacce46bd107da154be1c06939b855ecce57a1616ba71b',
          tag: 'span',
        });
      },
    );
  });
});
