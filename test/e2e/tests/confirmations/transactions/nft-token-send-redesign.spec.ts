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
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../../page-objects/pages/homepage';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

const TOKEN_RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Confirmation Redesign Token Send @no-mmi', function () {
  describe('ERC721', function () {
    describe('Wallet initiated', async function () {
      it('Sends a type 0 transaction (Legacy)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.legacy,
          async ({ driver, contractRegistry }: TestSuiteArguments) => {
            await createERC721WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
            );
          },
          erc721Mocks,
          SMART_CONTRACTS.NFTS,
        );
      });

      it('Sends a type 2 transaction (EIP1559)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.feeMarket,
          async ({ driver, contractRegistry }: TestSuiteArguments) => {
            await createERC721WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
            );
          },
          erc721Mocks,
          SMART_CONTRACTS.NFTS,
        );
      });
    });

    describe('dApp initiated', async function () {
      it('Sends a type 0 transaction (Legacy)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.legacy,
          async ({ driver, contractRegistry }: TestSuiteArguments) => {
            await createERC721DAppInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
            );
          },
          erc721Mocks,
          SMART_CONTRACTS.NFTS,
        );
      });

      it('Sends a type 2 transaction (EIP1559)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.feeMarket,
          async ({ driver, contractRegistry }: TestSuiteArguments) => {
            await createERC721DAppInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
            );
          },
          erc721Mocks,
          SMART_CONTRACTS.NFTS,
        );
      });
    });
  });

  describe('ERC1155', function () {
    describe('Wallet initiated', async function () {
      it('Sends a type 0 transaction (Legacy)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.legacy,
          async ({ driver, contractRegistry }: TestSuiteArguments) => {
            await createERC1155WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
            );
          },
          erc1155Mocks,
          SMART_CONTRACTS.ERC1155,
        );
      });

      it('Sends a type 2 transaction (EIP1559)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.feeMarket,
          async ({ driver, contractRegistry }: TestSuiteArguments) => {
            await createERC1155WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
            );
          },
          erc1155Mocks,
          SMART_CONTRACTS.ERC1155,
        );
      });
    });
  });
});

async function erc721Mocks(server: Mockttp) {
  return [await mockedERC7214BytesNFTTokenSend(server)];
}

async function erc1155Mocks(server: Mockttp) {
  return [await mockedERC11554BytesNFTTokenSend(server)];
}

export async function mockedERC7214BytesNFTTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0x23b872dd' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            bytes_signature: '#rÝ',
            created_at: '2016-07-09T03:58:28.927638Z',
            hex_signature: '0x23b872dd',
            id: 147,
            text_signature: 'transferFrom(address,address,uint256)',
          },
        ],
      },
    }));
}

export async function mockedERC11554BytesNFTTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0xf242432a' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            bytes_signature: 'òBC*',
            created_at: '2018-08-29T20:16:41.650553Z',
            hex_signature: '0xf242432a',
            id: 93843,
            text_signature:
              'safeTransferFrom(address,address,uint256,uint256,bytes)',
          },
        ],
      },
    }));
}

async function createERC721WalletInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.NFTS);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });

  await testDapp.clickERC721MintButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const mintConfirmation = new TransactionConfirmation(driver);

  await mintConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  const homePage = new HomePage(driver);
  await homePage.goToNftTab();
  await homePage.clickNFTIconOnActivityList();

  const nftDetailsPage = new NFTDetailsPage(driver);
  await nftDetailsPage.clickNFTSendButton();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient(TOKEN_RECIPIENT_ADDRESS);
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_walletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_interactingWithParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createERC721DAppInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.NFTS);

  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
  await testDapp.clickERC721MintButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const mintConfirmation = new TransactionConfirmation(driver);
  await mintConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.clickERC721TransferFromButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_dappInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_interactingWithParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createERC1155WalletInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
) {
  await unlockWallet(driver);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.ERC1155);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
  await testDapp.fillERC1155TokenID('1');
  await testDapp.fillERC1155TokenAmount('1');
  await testDapp.clickERC1155MintButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const mintConfirmation = new TransactionConfirmation(driver);
  await mintConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.clickERC1155WatchButton();

  await driver.delay(veryLargeDelayMs);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  const watchAssetConfirmation = new WatchAssetConfirmation(driver);
  await watchAssetConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  const homePage = new HomePage(driver);
  await homePage.goToNftTab();
  await homePage.clickNFTIconOnActivityList();

  const nftDetailsPage = new NFTDetailsPage(driver);
  await nftDetailsPage.clickNFTSendButton();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.check_pageIsLoaded();
  await sendToPage.fillRecipient(TOKEN_RECIPIENT_ADDRESS);
  await sendToPage.fillNFTAmount('1');
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.check_walletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.check_networkParagraph();
  await tokenTransferTransactionConfirmation.check_interactingWithParagraph();
  await tokenTransferTransactionConfirmation.check_networkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
