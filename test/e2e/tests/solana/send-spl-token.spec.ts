import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import {
  commonSolanaAddress,
  mockGetFeeForMessage,
  mockGetLatestBlockhash,
  mockGetMinimumBalanceForRentExemption,
  mockGetMintAccountInfo,
  mockGetMultipleAccounts,
  mockGetSuccessSignaturesForAddress,
  mockGetSuccessSplTokenTransaction,
  mockGetFailedSignaturesForAddress,
  mockGetFailedTransaction,
  mockGetTokenAccountsUSDCOnly,
  mockGetTokenAccountBalance,
  mockMultiCoinPrice,
  mockPriceApiExchangeRates,
  mockPriceApiSpotPriceSwap,
  mockSendSolanaTransaction,
  mockSolanaBalanceQuote,
  mockTokenApiAssets,
  simulateSolanaTransaction,
} from './common-solana';

async function mockSendWithUSDCVisible(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockGetTokenAccountsUSDCOnly(mockServer),
    await mockGetTokenAccountBalance(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSolanaTransaction(mockServer),
    await mockGetSuccessSignaturesForAddress(mockServer),
    await mockGetSuccessSplTokenTransaction(mockServer),
    await mockGetMintAccountInfo(mockServer),
    await mockTokenApiAssets(mockServer),
  ];
}

async function mockSendSPLTokenFailed(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockGetTokenAccountsUSDCOnly(mockServer),
    await mockGetTokenAccountBalance(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSolanaTransaction(mockServer),
    await mockGetFailedSignaturesForAddress(mockServer),
    await mockGetFailedTransaction(mockServer),
    await mockGetMintAccountInfo(mockServer),
    await mockTokenApiAssets(mockServer),
  ];
}

describe('Send flow - SPL Token', function (this: Suite) {
  it('user with more than 1 token in the token list', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendWithUSDCVisible,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'USDC',
        );

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient(commonSolanaAddress);
        await sendPage.fillAmount('0.1');
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        await activityList.checkTxAmountInActivity('-0.1 USDC', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  it('and send transaction fails', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendSPLTokenFailed,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'USDC',
        );

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient(commonSolanaAddress);
        await sendPage.fillAmount('0.1');
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkFailedTxNumberDisplayedInActivity();
        await activityList.checkTxAction({
          action: 'Interaction',
          confirmedTx: 0,
        });
      },
    );
  });
});
