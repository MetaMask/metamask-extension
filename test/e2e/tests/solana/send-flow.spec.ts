import { strict as assert } from 'assert';
import { Suite } from 'mocha';

import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { SOLANA_MAINNET_SCOPE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { buildSolanaTestSpecificMock } from './common-solana';

const commonSolanaAddress = 'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna';

describe('Send flow', function (this: Suite) {
  it('with some field validation', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        const sendPage = new SendPage(driver);

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '0' });
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');

        await sendPage.fillRecipient('2433asd');
        await sendPage.checkInvalidAddressError();

        await sendPage.fillRecipient(commonSolanaAddress);
        await sendPage.fillAmount('1');
        await sendPage.checkInsufficientFundsError();
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled and it shouldn`t',
        );
      },
    );
  });

  it('full flow of SOL with a positive balance account', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionSuccess: true,
        }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        const sendPage = new SendPage(driver);

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');

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
        await activityList.checkTxAmountInActivity('-0.00708 SOL', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  it('and transaction fails', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionFailed: true,
        }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new NonEvmHomepage(driver);
        const sendPage = new SendPage(driver);

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');

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
        await confirmation.checkSecurityAlertsErrorIsDisplayed();
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
