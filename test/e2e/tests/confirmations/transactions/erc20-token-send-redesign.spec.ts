/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL } from '../../../constants';
import { unlockWallet, WINDOW_TITLES } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import WatchAssetConfirmation from '../../../page-objects/pages/confirmations/legacy/watch-asset-confirmation';
import HomePage from '../../../page-objects/pages/homepage';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import TestDapp from '../../../page-objects/pages/test-dapp';
import GanacheContractAddressRegistry from '../../../seeder/ganache-contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withRedesignConfirmationFixtures } from '../helpers';
import { mocked4BytesSetApprovalForAll } from './erc721-revoke-set-approval-for-all-redesign';
import { TestSuiteArguments } from './shared';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Token Send @no-mmi', function () {
  it('Sends a type 0 transaction (Legacy)', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await createTransactionAndAssertDetails(driver, contractRegistry);
      },
      mocks,
      SMART_CONTRACTS.HST,
    );
  });

  it('Sends a type 2 transaction (EIP1559)', async function () {
    await withRedesignConfirmationFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.feeMarket,
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await createTransactionAndAssertDetails(driver, contractRegistry);
      },
      mocks,
      SMART_CONTRACTS.HST,
    );
  });
});

async function mocks(server: Mockttp) {
  return [await mocked4BytesSetApprovalForAll(server)];
}

async function createTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: GanacheContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as GanacheContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.HST);

  const testDapp = new TestDapp(driver);

  await testDapp.open({ contractAddress, url: DAPP_URL });

  await testDapp.clickERC20WatchAssetButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const watchAssetConfirmation = new WatchAssetConfirmation(driver);
  await watchAssetConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  const homePage = new HomePage(driver);
  await homePage.startSendFlow();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');
  await sendToPage.fillAmount('1');

  await sendToPage.click_assetPickerButton();
  await sendToPage.click_secondTokenListButton();
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_walletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_interactingWithParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
