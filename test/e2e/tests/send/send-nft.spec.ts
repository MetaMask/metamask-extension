/**
 * Send NFT Tests
 *
 * Tests for sending NFTs:
 * - ERC721: Wallet-initiated and dApp-initiated (EIP1559)
 * - ERC1155: Wallet-initiated (EIP1559)
 *
 * Note: Legacy transaction types follow the same UI flow and are
 * implicitly covered by gas customization tests elsewhere.
 */

import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Mockttp } from 'mockttp';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import NFTDetailsPage from '../../page-objects/pages/nft-details-page';
import NFTListPage from '../../page-objects/pages/home/nft-list';
import SendPage from '../../page-objects/pages/send/send-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/token-transfer-confirmation';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import WatchAssetConfirmation from '../../page-objects/pages/confirmations/watch-asset-confirmation';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import { veryLargeDelayMs } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import { withTransactionEnvelopeTypeFixtures } from '../confirmations/helpers';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

// Mock for ERC721 transferFrom
async function erc721Mocks(server: Mockttp) {
  return [
    await server
      .forGet('https://www.4byte.directory/api/v1/signatures/')
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
              // eslint-disable-next-line @typescript-eslint/naming-convention
              bytes_signature: '#rÝ',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              created_at: '2016-07-09T03:58:28.927638Z',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hex_signature: '0x23b872dd',
              id: 147,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              text_signature: 'transferFrom(address,address,uint256)',
            },
          ],
        },
      })),
  ];
}

// Mock for ERC1155 safeTransferFrom
async function erc1155Mocks(server: Mockttp) {
  return [
    await server
      .forGet('https://www.4byte.directory/api/v1/signatures/')
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
              // eslint-disable-next-line @typescript-eslint/naming-convention
              bytes_signature: 'òBC*',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              created_at: '2018-08-29T20:16:41.650553Z',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hex_signature: '0xf242432a',
              id: 93843,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              text_signature:
                'safeTransferFrom(address,address,uint256,uint256,bytes)',
            },
          ],
        },
      })),
  ];
}

describe('Send NFT', function () {
  this.timeout(200000); // NFT tests require minting first

  describe('ERC721', function () {
    const smartContract = SMART_CONTRACTS.NFTS;

    describe('Wallet initiated', function () {
      it('sends ERC721', async function () {
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

            // Mint NFT first
            await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
            await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
            await testDapp.clickERC721MintButton();

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const mintConfirmation = new TransactionConfirmation(driver);
            await mintConfirmation.clickFooterConfirmButton();

            // Wait for mint and navigate to NFT
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await homePage.goToActivityList();
            await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);

            await homePage.goToNftTab();
            await new NFTListPage(driver).clickNFTIconOnActivityList();

            // Send the NFT
            const nftDetailsPage = new NFTDetailsPage(driver);
            await nftDetailsPage.clickNFTSendButton();

            const sendPage = new SendPage(driver);
            await sendPage.fillRecipient(DEFAULT_RECIPIENT);
            await sendPage.pressContinueButton();

            const tokenTransferConfirmation =
              new TokenTransferTransactionConfirmation(driver);
            await tokenTransferConfirmation.checkWalletInitiatedHeadingTitle();
            await tokenTransferConfirmation.clickScrollToBottomButton();
            await tokenTransferConfirmation.clickFooterConfirmButton();

            await activityListPage.checkConfirmedTxNumberDisplayedInActivity(2);
          },
          erc721Mocks,
          smartContract,
        );
      });
    });

    describe('dApp initiated', function () {
      it('sends ERC721', async function () {
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

            // Mint NFT first
            await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
            await testDapp.clickERC721MintButton();

            await driver.delay(veryLargeDelayMs);
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const mintConfirmation = new TransactionConfirmation(driver);
            await mintConfirmation.clickFooterConfirmButton();

            // Transfer via dApp
            await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
            await testDapp.clickERC721TransferFromButton();

            await driver.delay(veryLargeDelayMs);
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            const tokenTransferConfirmation =
              new TokenTransferTransactionConfirmation(driver);
            await tokenTransferConfirmation.checkDappInitiatedHeadingTitle();
            await tokenTransferConfirmation.clickScrollToBottomButton();
            await tokenTransferConfirmation.clickFooterConfirmButton();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await homePage.goToActivityList();
            await activityListPage.checkConfirmedTxNumberDisplayedInActivity(2);
          },
          erc721Mocks,
          smartContract,
        );
      });
    });
  });

  describe('ERC1155', function () {
    const smartContract = SMART_CONTRACTS.ERC1155;

    describe('Wallet initiated', function () {
      it('sends ERC1155', async function () {
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

            // Mint ERC1155
            await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
            await testDapp.fillERC1155TokenID('1');
            await testDapp.fillERC1155TokenAmount('1');
            await testDapp.clickERC1155MintButton();

            await driver.delay(veryLargeDelayMs);
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const mintConfirmation = new TransactionConfirmation(driver);
            await mintConfirmation.clickFooterConfirmButton();

            // Watch the token
            await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
            await testDapp.clickERC1155WatchButton();

            await driver.delay(veryLargeDelayMs);
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const watchAssetConfirmation = new WatchAssetConfirmation(driver);
            await watchAssetConfirmation.clickFooterConfirmButton();

            // Navigate to NFT and send
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await homePage.goToNftTab();
            await new NFTListPage(driver).clickNFTIconOnActivityList();

            const nftDetailsPage = new NFTDetailsPage(driver);
            await nftDetailsPage.clickNFTSendButton();

            const sendPage = new SendPage(driver);
            await sendPage.fillRecipient(DEFAULT_RECIPIENT);
            await sendPage.fillAmount('1');
            await sendPage.pressContinueButton();

            const tokenTransferConfirmation =
              new TokenTransferTransactionConfirmation(driver);
            await tokenTransferConfirmation.checkWalletInitiatedHeadingTitle();
            await tokenTransferConfirmation.clickScrollToBottomButton();
            await tokenTransferConfirmation.clickFooterConfirmButton();

            await activityListPage.checkConfirmedTxNumberDisplayedInActivity(2);
          },
          erc1155Mocks,
          smartContract,
        );
      });
    });
  });
});
