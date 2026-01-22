import { createInternalTransaction } from '../../page-objects/flows/transaction';
import SendPage from '../../page-objects/pages/send/send-page';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionDetailsPage from '../../page-objects/pages/home/transaction-details';
import AssetList from '../../page-objects/pages/home/asset-list';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';

const hexPrefixedAddress = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const hexAbbreviatedAddress = '0x2f318...5C970';
const nonHexPrefixedAddress = hexPrefixedAddress.substring(2);

describe('Hexadecimal address prefix normalization', function () {
  describe('Send ETH', function () {
    it('should ensure the address is prefixed with 0x when pasted and should send ETH to a valid hexadecimal address', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withPreferencesControllerPetnamesDisabled()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await createInternalTransaction({
            driver,
            recipientAddress: nonHexPrefixedAddress,
          });

          // Confirm transaction
          const confirmation = new Confirmation(driver);
          await confirmation.clickFooterConfirmButton();
          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityListPage = new ActivityListPage(driver);
          await activityListPage.checkConfirmedTxNumberDisplayedInActivity();
          await activityListPage.clickConfirmedTransaction();
          const transactionDetailsPage = new TransactionDetailsPage(driver);

          // Verify address in activity log
          await transactionDetailsPage.checkAddressInActivityLog(
            hexAbbreviatedAddress,
          );
        },
      );
    });
  });

  describe('Send ERC20', function () {
    const smartContract = SMART_CONTRACTS.HST;

    it('should ensure the address is prefixed with 0x when pasted and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .withTokensControllerERC20()
          .withEnabledNetworks({ eip155: { '0x539': true } })
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Send TST
        const homePage = new HomePage(driver);
        await homePage.goToTokensTab();
        const assetList = new AssetList(driver);
        await assetList.clickMultichainTokenListButton();
        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.clickOnSendButton();
        // Paste address without hex prefix
        const sendPage = new SendPage(driver);
        await sendPage.fillRecipient(nonHexPrefixedAddress);
        await sendPage.pressContinueButton();

        // Verify address in activity log
        const transactionDetailsPage = new TransactionDetailsPage(driver);
        await transactionDetailsPage.checkAddressInActivityLog(
          hexAbbreviatedAddress,
        );
      },
    );
    });

    it('should ensure the address is prefixed with 0x when typed and should send TST to a valid hexadecimal address', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPreferencesControllerPetnamesDisabled()
          .withEnabledNetworks({ eip155: { '0x539': true } })
          .withTokensControllerERC20()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        // Send TST
        const homePage = new HomePage(driver);
        await homePage.goToTokensTab();
        const assetList = new AssetList(driver);
        await assetList.clickMultichainTokenListButton();
        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.clickOnSendButton();

        // Type address without hex prefix
        const sendPage = new SendPage(driver);
        await sendPage.fillRecipient(nonHexPrefixedAddress);
        await sendPage.fillAmount('0');
        await sendPage.pressContinueButton();

        // Confirm transaction
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkSendAmount('0 ETH');
        const confirmation = new Confirmation(driver);
        await confirmation.clickFooterConfirmButton();
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity();
        await activityListPage.clickConfirmedTransaction();
        const transactionDetailsPage = new TransactionDetailsPage(driver);

        // Verify address in activity log
        await transactionDetailsPage.checkAddressInActivityLog(
          hexAbbreviatedAddress,
        );
      },
    );
    });
  });
});
