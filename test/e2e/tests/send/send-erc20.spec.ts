/**
 * Send ERC20 Token Tests
 *
 * Tests for sending ERC20 tokens:
 * - Wallet-initiated send (EIP1559)
 * - dApp-initiated send (EIP1559)
 *
 * Note: Legacy transaction types are tested in send-erc20-gas.spec.ts
 * via gas customization scenarios.
 */

import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Mockttp } from 'mockttp';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/token-transfer-confirmation';
import WatchAssetConfirmation from '../../page-objects/pages/confirmations/watch-asset-confirmation';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import { veryLargeDelayMs } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import {
  mockedSourcifyTokenSend,
  withTransactionEnvelopeTypeFixtures,
} from '../confirmations/helpers';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const smartContract = SMART_CONTRACTS.HST;

async function erc20Mocks(server: Mockttp) {
  return [await mockedSourcifyTokenSend(server)];
}

describe('Send ERC20', function () {
  describe('Wallet initiated', function () {
    it('sends ERC20 token', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: {
          driver: Driver;
          contractRegistry?: ContractAddressRegistry;
          localNodes?: Anvil[];
        }) => {
          await loginWithBalanceValidation(driver, localNodes?.[0]);

          const tokenAddress =
            await contractRegistry?.getContractAddress(smartContract);
          const assetListPage = new AssetListPage(driver);
          await assetListPage.importCustomTokenByChain(
            '0x539',
            tokenAddress as string,
          );

          const homePage = new HomePage(driver);
          const sendPage = new SendPage(driver);
          const confirmation = new Confirmation(driver);
          const activityListPage = new ActivityListPage(driver);

          await homePage.startSendFlow();
          await sendPage.selectToken('0x539', 'TST');
          await sendPage.fillRecipient(DEFAULT_RECIPIENT);
          await sendPage.fillAmount('1');
          await sendPage.pressContinueButton();

          await confirmation.checkPageIsLoaded();
          await confirmation.clickFooterConfirmButton();

          await activityListPage.checkTransactionActivityByText('Sent');
          await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
        },
        erc20Mocks,
        smartContract,
      );
    });
  });

  describe('dApp initiated', function () {
    it('sends ERC20 token', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: {
          driver: Driver;
          contractRegistry?: ContractAddressRegistry;
          localNodes?: Anvil[];
        }) => {
          await loginWithBalanceValidation(driver, localNodes?.[0]);

          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);
          const testDapp = new TestDapp(driver);
          const homePage = new HomePage(driver);
          const activityListPage = new ActivityListPage(driver);

          await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

          // Watch the token first
          await driver.delay(1000);
          await testDapp.clickERC20WatchAssetButton();

          await driver.delay(veryLargeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const watchAssetConfirmation = new WatchAssetConfirmation(driver);
          await watchAssetConfirmation.clickFooterConfirmButton();

          // Initiate transfer
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.clickERC20TokenTransferButton();

          await driver.delay(veryLargeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const tokenTransferConfirmation =
            new TokenTransferTransactionConfirmation(driver);
          await tokenTransferConfirmation.checkDappInitiatedHeadingTitle();
          await tokenTransferConfirmation.clickFooterConfirmButton();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await homePage.goToActivityList();
          await activityListPage.checkTransactionActivityByText('Sent');
        },
        erc20Mocks,
        smartContract,
      );
    });
  });
});
