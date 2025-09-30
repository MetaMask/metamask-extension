/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL } from '../../../constants';
import { veryLargeDelayMs, WINDOW_TITLES } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import { Anvil } from '../../../seeder/anvil';
import WatchAssetConfirmation from '../../../page-objects/pages/confirmations/legacy/watch-asset-confirmation';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import {
  mockedSourcifyTokenSend,
  withTransactionEnvelopeTypeFixtures,
} from '../helpers';
import { TestSuiteArguments } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Token Send', function () {
  describe('Wallet initiated', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createWalletInitiatedTransactionAndAssertDetails(
            driver,
            contractRegistry,
          );
        },
        mocks,
        SMART_CONTRACTS.HST,
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createWalletInitiatedTransactionAndAssertDetails(
            driver,
            contractRegistry,
            localNodes?.[0],
          );
        },
        mocks,
        SMART_CONTRACTS.HST,
      );
    });
  });

  describe('dApp initiated', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createDAppInitiatedTransactionAndAssertDetails(
            driver,
            contractRegistry,
            localNodes?.[0],
          );
        },
        mocks,
        SMART_CONTRACTS.HST,
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          await createDAppInitiatedTransactionAndAssertDetails(
            driver,
            contractRegistry,
            localNodes?.[0],
          );
        },
        mocks,
        SMART_CONTRACTS.HST,
      );
    });
  });
});

async function mocks(server: Mockttp) {
  return [await mockedSourcifyTokenSend(server)];
}

async function createWalletInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
  localNode?: Anvil,
) {
  await loginWithBalanceValidation(driver, localNode);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.HST);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

  await driver.delay(1000);
  await testDapp.clickERC20WatchAssetButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const watchAssetConfirmation = new WatchAssetConfirmation(driver);
  await watchAssetConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  const homePage = new HomePage(driver);
  await homePage.startSendFlow();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.checkPageIsLoaded();
  await sendToPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');
  await sendToPage.fillAmount('1');

  await sendToPage.clickAssetPickerButton();
  await sendToPage.clickSecondTokenListButton();
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkWalletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkInteractingWithParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createDAppInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
  localNode?: Anvil,
) {
  await loginWithBalanceValidation(driver, localNode);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.HST);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

  await driver.delay(1000);
  await testDapp.clickERC20WatchAssetButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const watchAssetConfirmation = new WatchAssetConfirmation(driver);
  await watchAssetConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.clickERC20TokenTransferButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkDappInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkInteractingWithParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
