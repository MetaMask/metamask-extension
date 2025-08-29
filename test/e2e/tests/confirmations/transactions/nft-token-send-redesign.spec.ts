/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { DAPP_URL } from '../../../constants';
import { veryLargeDelayMs, WINDOW_TITLES } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import { Anvil } from '../../../seeder/anvil';
import WatchAssetConfirmation from '../../../page-objects/pages/confirmations/legacy/watch-asset-confirmation';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import TokenTransferTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import NFTListPage from '../../../page-objects/pages/home/nft-list';
import NFTDetailsPage from '../../../page-objects/pages/nft-details-page';
import SendTokenPage from '../../../page-objects/pages/send/send-token-page';
import TestDapp from '../../../page-objects/pages/test-dapp';
import ContractAddressRegistry from '../../../seeder/contract-address-registry';
import { Driver } from '../../../webdriver/driver';
import { withTransactionEnvelopeTypeFixtures } from '../helpers';
import { TestSuiteArguments } from './shared';

const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

const TOKEN_RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Confirmation Redesign Token Send', function () {
  this.timeout(200000); // This test is very long, so we need an unusually high timeout
  describe('ERC721', function () {
    describe('Wallet initiated', function () {
      it('Sends a type 0 transaction (Legacy)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.legacy,
          async ({
            driver,
            contractRegistry,
            localNodes,
          }: TestSuiteArguments) => {
            await createERC721WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
              localNodes?.[0],
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
          async ({
            driver,
            contractRegistry,
            localNodes,
          }: TestSuiteArguments) => {
            await createERC721WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
              localNodes?.[0],
            );
          },
          erc721Mocks,
          SMART_CONTRACTS.NFTS,
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
            await createERC721DAppInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
              localNodes?.[0],
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
          async ({
            driver,
            contractRegistry,
            localNodes,
          }: TestSuiteArguments) => {
            await createERC721DAppInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
              localNodes?.[0],
            );
          },
          erc721Mocks,
          SMART_CONTRACTS.NFTS,
        );
      });
    });
  });

  describe('ERC1155', function () {
    describe('Wallet initiated', function () {
      it('Sends a type 0 transaction (Legacy)', async function () {
        await withTransactionEnvelopeTypeFixtures(
          this.test?.fullTitle(),
          TransactionEnvelopeType.legacy,
          async ({
            driver,
            contractRegistry,
            localNodes,
          }: TestSuiteArguments) => {
            await createERC1155WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
              localNodes?.[0],
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
          async ({
            driver,
            contractRegistry,
            localNodes,
          }: TestSuiteArguments) => {
            await createERC1155WalletInitiatedTransactionAndAssertDetails(
              driver,
              contractRegistry,
              localNodes?.[0],
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

async function mockedERC7214BytesNFTTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            bytes_signature: '#rÝ',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            created_at: '2016-07-09T03:58:28.927638Z',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hex_signature: '0x23b872dd',
            id: 147,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            text_signature: 'transferFrom(address,address,uint256)',
          },
        ],
      },
    }));
}

async function mockedERC11554BytesNFTTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            bytes_signature: 'òBC*',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            created_at: '2018-08-29T20:16:41.650553Z',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hex_signature: '0xf242432a',
            id: 93843,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
  localNode?: Anvil,
) {
  await loginWithBalanceValidation(driver, localNode);

  const contractAddress = await (
    contractRegistry as ContractAddressRegistry
  ).getContractAddress(SMART_CONTRACTS.NFTS);

  const testDapp = new TestDapp(driver);

  await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.clickERC721MintButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const mintConfirmation = new TransactionConfirmation(driver);

  await mintConfirmation.clickFooterConfirmButton();

  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await new HomePage(driver).goToNftTab();
  await new NFTListPage(driver).clickNFTIconOnActivityList();

  const nftDetailsPage = new NFTDetailsPage(driver);
  await nftDetailsPage.clickNFTSendButton();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.checkPageIsLoaded();
  await sendToPage.fillRecipient(TOKEN_RECIPIENT_ADDRESS);
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkWalletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkInteractingWithParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createERC721DAppInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
  localNode?: Anvil,
) {
  await loginWithBalanceValidation(driver, localNode);

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
  await tokenTransferTransactionConfirmation.checkDappInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkInteractingWithParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}

async function createERC1155WalletInitiatedTransactionAndAssertDetails(
  driver: Driver,
  contractRegistry?: ContractAddressRegistry,
  localNode?: Anvil,
) {
  await loginWithBalanceValidation(driver, localNode);

  const homePage = new HomePage(driver);
  await homePage.checkHasAccountSyncingSyncedAtLeastOnce();

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
  await homePage.goToNftTab();
  await new NFTListPage(driver).clickNFTIconOnActivityList();

  const nftDetailsPage = new NFTDetailsPage(driver);
  await nftDetailsPage.clickNFTSendButton();

  const sendToPage = new SendTokenPage(driver);
  await sendToPage.checkPageIsLoaded();
  await sendToPage.fillRecipient(TOKEN_RECIPIENT_ADDRESS);
  await sendToPage.fillNFTAmount('1');
  await sendToPage.goToNextScreen();

  const tokenTransferTransactionConfirmation =
    new TokenTransferTransactionConfirmation(driver);
  await tokenTransferTransactionConfirmation.checkWalletInitiatedHeadingTitle();
  await tokenTransferTransactionConfirmation.checkNetworkParagraph();
  await tokenTransferTransactionConfirmation.checkInteractingWithParagraph();
  await tokenTransferTransactionConfirmation.checkNetworkFeeParagraph();

  await tokenTransferTransactionConfirmation.clickScrollToBottomButton();
  await tokenTransferTransactionConfirmation.clickFooterConfirmButton();
}
