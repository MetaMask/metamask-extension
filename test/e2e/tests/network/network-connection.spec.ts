import { Suite } from 'mocha';
import { Hex } from '@metamask/utils';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { WINDOW_TITLES } from '../../constants';
import { veryLargeDelayMs, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenList from '../../page-objects/pages/token-list';
import ConfirmAlertModal from '../../page-objects/pages/dialog/confirm-alert';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import { WALLET_ADDRESS } from '../confirmations/signatures/signature-helpers';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { NetworkConnectionEvidenceCollector } from './network-connection-evidence';

/**
 * Dismiss "Review alert" / field-alert friction: paginate multi-alert UI if present, then
 * acknowledge (see footer.tsx `ConfirmButton` + confirm-alert-modal / alert-modal test IDs).
 *
 * @param driver - WebDriver session (dialog must be active).
 */
async function dismissReviewAlertFriction(driver: Driver): Promise<void> {
  const alertModal = new ConfirmAlertModal(driver);
  for (let i = 0; i < 15; i += 1) {
    await driver.clickElementSafe({ testId: 'alert-modal-next-button' }, 400);
  }
  try {
    await alertModal.acknowledgeAlert();
  } catch {
    try {
      await alertModal.confirmFromAlertModal();
    } catch {
      // No friction surface (e.g. signature with no danger alerts)
    }
  }
}

/**
 * Complete the confirmation: wait for gas/RPC UI, scroll, open review friction if any,
 * acknowledge, then final Confirm and wait for the dialog to close.
 *
 * @param driver - WebDriver session (dialog must be active).
 */
async function completeConfirmationInDialog(driver: Driver): Promise<void> {
  await driver.delay(veryLargeDelayMs * 2);
  const confirmation = new Confirmation(driver);
  await confirmation.clickScrollToBottomButton();

  await confirmation.clickFooterConfirmButton();
  await driver.delay(1200);
  await dismissReviewAlertFriction(driver);
  await driver.delay(400);

  try {
    await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
  } catch {
    // First footer click may have already submitted and closed (no review step).
  }
}

// Network configuration type
type NetworkConfig = {
  name: string;
  tokenSymbol: string;
  fixtureMethod: (builder: FixtureBuilder) => FixtureBuilder;
  testTitle: string;
  chainId: Hex;
};

// Network configurations
const networkConfigs: NetworkConfig[] = [
  {
    name: 'Monad Testnet',
    tokenSymbol: 'MON',
    fixtureMethod: (builder) => builder.withNetworkControllerOnMonad(),
    testTitle: 'Monad Network Connection Tests',
    chainId: CHAIN_IDS.MONAD_TESTNET,
  },
  // TODO: Uncomment this when the test MegaETH Testnet v2 is fixed
  // {
  //   name: 'MegaETH Testnet',
  //   tokenSymbol: 'ETH',
  //   fixtureMethod: (builder) => builder.withNetworkControllerOnMegaETH(),
  //   testTitle: 'MegaETH Network Connection Tests',
  //   chainId: CHAIN_IDS.MEGAETH_TESTNET_V2,
  // },
  {
    name: 'Sei',
    tokenSymbol: 'SEI',
    fixtureMethod: (builder) => builder.withNetworkControllerOnSei(),
    testTitle: 'Sei Network Connection Tests',
    chainId: CHAIN_IDS.SEI,
  },
];

// Helper function to perform Dapp action and verify
const performDappActionAndVerify = async (
  driver: Driver,
  evidence: NetworkConnectionEvidenceCollector,
  slug: string,
  action: () => Promise<void>,
  networkName: string,
  testTitle: string,
  evidenceScreenshotName: string,
) => {
  await evidence.captureDappPre(driver, slug);
  await action();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(500);
  const confirmAlertModal = new ConfirmAlertModal(driver);
  await confirmAlertModal.verifyNetworkDisplay(networkName);
  await driver.takeScreenshot(testTitle, evidenceScreenshotName);
  await completeConfirmationInDialog(driver);
  await evidence.captureDappPostAndRecordRpc(
    driver,
    slug,
    evidenceScreenshotName,
  );
};

// Generate test cases for each network
networkConfigs.forEach((config) => {
  describe(config.testTitle, function (this: Suite) {
    it(`should connect dapp to ${config.name} and verify ${config.tokenSymbol} network and tokens`, async function () {
      const testTitle = this.test?.fullTitle() ?? '';
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: config
            .fixtureMethod(new FixtureBuilder())
            .withPermissionControllerConnectedToTestDapp()
            .withEnabledNetworks({
              eip155: {
                [config.chainId]: true,
              },
            })
            .build(),
          title: testTitle,
        },
        async ({ driver }: { driver: Driver }) => {
          const evidence = new NetworkConnectionEvidenceCollector({
            networkLabel: config.name,
            chainId: config.chainId,
            testTitle,
            browser: process.env.SELENIUM_BROWSER ?? 'chrome',
          });

          await login(driver);

          const tokenList = new TokenList(driver);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Verify token is displayed
          await tokenList.checkTokenName(config.tokenSymbol);
          await driver.takeScreenshot(testTitle, 'evidence-home-native-token');

          // Open the test dapp and verify balance
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          // Verify dapp can access the account
          await testDapp.checkGetAccountsResult(WALLET_ADDRESS.toLowerCase());
          await driver.takeScreenshot(testTitle, 'evidence-dapp-eth-accounts');

          // Test various Dapp functionalities
          await performDappActionAndVerify(
            driver,
            evidence,
            'simple-send',
            () => testDapp.clickSimpleSendButton(),
            config.name,
            testTitle,
            'evidence-confirm-simple-send',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'create-token',
            () => testDapp.clickCreateToken(),
            config.name,
            testTitle,
            'evidence-confirm-create-token',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'erc721-deploy',
            () => testDapp.clickERC721DeployButton(),
            config.name,
            testTitle,
            'evidence-confirm-erc721-deploy',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'personal-sign',
            () => testDapp.clickPersonalSign(),
            config.name,
            testTitle,
            'evidence-confirm-personal-sign',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'sign-typed-data-v1',
            () => testDapp.clickSignTypedData(),
            config.name,
            testTitle,
            'evidence-confirm-sign-typed-data-v1',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'sign-typed-data-v3',
            () => testDapp.clickSignTypedDatav3(),
            config.name,
            testTitle,
            'evidence-confirm-sign-typed-data-v3',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'sign-typed-data-v4',
            () => testDapp.clickSignTypedDatav4(),
            config.name,
            testTitle,
            'evidence-confirm-sign-typed-data-v4',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'permit',
            () => testDapp.clickPermit(),
            config.name,
            testTitle,
            'evidence-confirm-permit',
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            evidence,
            'erc1155-deploy',
            () => testDapp.clickERC1155DeployButton(),
            config.name,
            testTitle,
            'evidence-confirm-erc1155-deploy',
          );

          const reportPaths = await evidence.writeReports();
          console.log(
            'Network connection evidence report written:',
            reportPaths.htmlPath,
            reportPaths.jsonPath,
          );
        },
      );
    });
  });
});
