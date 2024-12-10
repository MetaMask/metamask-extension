/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL } from '../../../constants';
import {
  unlockWallet,
  veryLargeDelayMs,
  WINDOW_TITLES,
} from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import WatchAssetConfirmation from '../../../page-objects/pages/confirmations/legacy/watch-asset-confirmation';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import HomePage from '../../../page-objects/pages/homepage';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Token Send @no-mmi', function () {
  describe('Wallet initiated', async function () {
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
  });

  describe('dApp initiated', async function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.legacy,
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createDAppInitiatedTransactionAndAssertDetails(
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
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await createDAppInitiatedTransactionAndAssertDetails(
            driver,
            contractRegistry,
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

export async function mockedSourcifyTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0xa9059cbb' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            bytes_signature: '©\u0005»',
            created_at: '2016-07-09T03:58:28.234977Z',
            hex_signature: '0xa9059cbb',
            id: 145,
            text_signature: 'transfer(address,uint256)',
          },
        ],
      },
    }));
}

async function createWalletInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.HST);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

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

  await sendToPage.clickAssetPickerButton();
  await sendToPage.clickSecondTokenListButton();
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_walletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_interactingWithParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createDAppInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.HST);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

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
  await tokenTransferTransactionConfirmation.check_dappInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_interactingWithParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
