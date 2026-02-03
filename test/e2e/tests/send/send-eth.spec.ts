/**
 * Send ETH Tests
 *
 * Tests for sending native ETH:
 * - Wallet-initiated send (EIP1559)
 * - dApp-initiated send (EIP1559)
 * - Address book functionality
 * - ENS/name lookup resolution
 *
 * Note: Legacy transaction types are tested in send-eth-advanced.spec.ts
 * via gas customization scenarios.
 */

import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Mockttp } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import FixtureBuilder from '../../fixtures/fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/token-transfer-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { DAPP_PATH, DAPP_URL, WINDOW_TITLES } from '../../constants';
import { veryLargeDelayMs, withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockLookupSnap } from '../../mock-response-data/snaps/snap-binary-mocks';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction';
import { withTransactionEnvelopeTypeFixtures } from '../confirmations/helpers';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Send ETH', function () {
  describe('Wallet initiated', function () {
    it('sends ETH', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          localNodes,
        }: {
          driver: Driver;
          localNodes?: Anvil[];
        }) => {
          await loginWithBalanceValidation(driver, localNodes?.[0]);

          const homePage = new HomePage(driver);
          const sendPage = new SendPage(driver);
          const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
          const activityListPage = new ActivityListPage(driver);

          await homePage.startSendFlow();
          await sendPage.selectToken('0x539', 'ETH');
          await sendPage.fillRecipient(DEFAULT_RECIPIENT);
          await sendPage.fillAmount('1');
          await sendPage.pressContinueButton();

          await sendTokenConfirmPage.clickOnConfirm();

          await activityListPage.checkTransactionActivityByText('Sent');
          await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
          await activityListPage.checkTxAmountInActivity('-1 ETH');
        },
      );
    });
  });

  describe('dApp initiated', function () {
    it('sends ETH', async function () {
      await withTransactionEnvelopeTypeFixtures(
        this.test?.fullTitle(),
        TransactionEnvelopeType.feeMarket,
        async ({
          driver,
          localNodes,
        }: {
          driver: Driver;
          localNodes?: Anvil[];
        }) => {
          await loginWithBalanceValidation(driver, localNodes?.[0]);

          const testDapp = new TestDapp(driver);
          const homePage = new HomePage(driver);
          const activityListPage = new ActivityListPage(driver);

          await testDapp.openTestDappPage({
            contractAddress: null,
            url: DAPP_URL,
          });
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.clickSimpleSendButton();

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
          await activityListPage.checkTransactionActivityByText('Sent');
        },
      );
    });
  });

  describe('Address book', function () {
    it('sends to address book entry', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withAddressBookController({
              addressBook: {
                '0x539': {
                  '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                    address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                    chainId: '0x539',
                    isEns: false,
                    memo: '',
                    name: 'Test Name 1',
                  },
                },
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
          const activityListPage = new ActivityListPage(driver);

          await createInternalTransaction({
            driver,
            chainId: '0x539',
            symbol: 'ETH',
            recipientName: 'Test Name 1',
            amount: '1',
          });

          await sendTokenConfirmationPage.clickOnConfirm();
          await activityListPage.checkTransactionActivityByText('Sent');
          await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
          await activityListPage.checkTxAmountInActivity('-1 ETH');
        },
      );
    });
  });

  describe('ENS resolution', function () {
    it('resolves ENS/name lookup address', async function () {
      await withFixtures(
        {
          dappOptions: {
            customDappPaths: [DAPP_PATH.TEST_SNAPS],
          },
          fixtures: new FixtureBuilder({
            inputChainId: CHAIN_IDS.MAINNET,
          }).build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer: Mockttp) => {
            mockLookupSnap(mockServer);
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          await openTestSnapClickButtonAndInstall(
            driver,
            'connectNameLookUpButton',
          );
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const homePage = new HomePage(driver);
          const sendPage = new SendPage(driver);

          await homePage.startSendFlow();
          await sendPage.selectToken('0x1', 'ETH');
          await sendPage.fillRecipient('test.eth');

          await driver.findElement({ text: '0xc0ffe...54979' });
        },
      );
    });
  });
});
