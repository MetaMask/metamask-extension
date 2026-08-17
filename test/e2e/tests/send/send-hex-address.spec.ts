/**
 * Send - Hex Address Prefix Normalization Tests
 *
 * Tests that addresses without 0x prefix are properly normalized
 * when pasted or typed in the send flow.
 */

import { createInternalTransaction } from '../../page-objects/flows/transaction.flow';
import SendPage from '../../page-objects/pages/send/send-page';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';

const hexPrefixedAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const nonHexPrefixedAddress = hexPrefixedAddress.substring(2);

describe('Send - Hex Address Normalization', function () {
  describe('ETH', function () {
    it('normalizes address without 0x prefix and sends ETH', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await login(driver);

          await createInternalTransaction({
            driver,
            recipientAddress: nonHexPrefixedAddress,
          });

          // Confirm transaction
          const confirmation = new Confirmation(driver);
          await confirmation.clickFooterConfirmButton();
          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityTab = new ActivityTab(driver);
          await activityTab.checkConfirmedTxNumberDisplayedInActivity();
          await activityTab.clickConfirmedTransaction();
          const transactionDetailsPage = new TransactionDetailsPage(driver);

          // Verify address in activity log
          await transactionDetailsPage.checkAddressInActivityLog(
            hexPrefixedAddress.toLowerCase(),
          );
        },
      );
    });
  });

  describe('ERC20', function () {
    const smartContract = SMART_CONTRACTS.HST;

    it('normalizes pasted address without 0x prefix', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2().withTokensControllerERC20().build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, localNodes }) => {
          await login(driver, { localNode: localNodes[0] });

          // Send TST
          const homePage = new HomePage(driver);
          await homePage.goToTokensTab();
          const tokensTab = new TokensTab(driver);
          await tokensTab.clickOnAsset('TST');
          await tokensTab.clickMultichainTokenListButton();
          await homePage.clickOnSendButton();
          // Paste address without hex prefix
          const sendPage = new SendPage(driver);
          await sendPage.fillRecipient({
            recipientAddress: nonHexPrefixedAddress,
          });
          await sendPage.pressContinueButton();

          // Verify address on confirmation screen
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkAddressIsDisplayed('0x2f318C');
        },
      );
    });

    it('normalizes typed address without 0x prefix and sends TST', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2().withTokensControllerERC20().build(),
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, localNodes }) => {
          await login(driver, { localNode: localNodes[0] });

          // Send TST
          const homePage = new HomePage(driver);
          await homePage.goToTokensTab();
          const tokensTab = new TokensTab(driver);
          await tokensTab.clickOnAsset('TST');
          await tokensTab.clickMultichainTokenListButton();
          await homePage.clickOnSendButton();

          // Type address without hex prefix
          const sendPage = new SendPage(driver);
          await sendPage.fillRecipient({
            recipientAddress: nonHexPrefixedAddress,
          });
          await sendPage.fillAmount('0');
          await sendPage.pressContinueButton();

          // Confirm transaction
          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkSendAmount('0 TST');
          const confirmation = new Confirmation(driver);
          await confirmation.clickFooterConfirmButton();
          await homePage.goToActivityList();
          const activityTab = new ActivityTab(driver);
          await activityTab.checkConfirmedTxNumberDisplayedInActivity();
          await activityTab.clickConfirmedTransaction();
          const transactionDetailsPage = new TransactionDetailsPage(driver);

          // Verify address in activity log
          await transactionDetailsPage.checkAddressInActivityLog(
            hexPrefixedAddress,
          );
        },
      );
    });
  });
});
