import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import {
  queueSignatures,
  queueSignaturesAndTransactions,
} from '../../page-objects/flows/confirmation-navigation.flow';
import { login } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { createDappTransaction } from '../../page-objects/flows/transaction.flow';
import { TestSnaps } from '../../page-objects/pages/test-snaps';
import { openTestSnapClickButtonAndInstall } from '../../page-objects/flows/install-test-snap.flow';
import SignTypedData from '../../page-objects/pages/confirmations/sign-typed-data-confirmation';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import {
  DAPP_ONE_URL,
  DAPP_PATH,
  MOCK_ANALYTICS_ID,
  WINDOW_TITLES,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { mockDialogSnap } from '../../mock-response-data/snaps/snap-binary-mocks';
import { withTransactionEnvelopeTypeFixtures } from './helpers';
import {
  SIGN_TYPED_DATA_EXPECTED,
  SIGN_TYPED_DATA_V1_INFO,
  SIGN_TYPED_DATA_V3_INFO,
  SIGN_TYPED_DATA_V4_INFO,
} from './signatures/sign-typed-data-expected';

describe('Confirmation Navigation', function (this: Suite) {
  it('initiates and queues multiple signatures and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        const confirmation = new SignTypedData(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
        await testDapp.openTestDappPage();
        await queueSignatures(driver);

        await confirmation.verifySignTypedDataInfo(SIGN_TYPED_DATA_V1_INFO);
        await confirmation.clickNextPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await confirmation.verifySignTypedDataV3Info(SIGN_TYPED_DATA_V3_INFO);
        await confirmation.clickNextPage();

        // Verify Sign Typed Data v4 confirmation is displayed
        await confirmation.verifySignTypedDataV4Info(SIGN_TYPED_DATA_V4_INFO);
        await confirmation.clickPreviousPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await confirmation.verifySignTypedDataV3Info(SIGN_TYPED_DATA_V3_INFO);
        await confirmation.clickPreviousPage();
        // Verify Sign Typed Data v3 confirmation is displayed
        await confirmation.verifySignTypedDataInfo(SIGN_TYPED_DATA_V1_INFO);
      },
    );
  });

  it('initiates and queues a mix of signatures and transactions and navigates', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        const confirmation = new TransactionConfirmation(driver);
        const signTypedDataConfirmation = new SignTypedData(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
        await testDapp.openTestDappPage();
        await queueSignaturesAndTransactions(driver);

        await signTypedDataConfirmation.verifySignTypedDataInfo(
          SIGN_TYPED_DATA_V1_INFO,
        );
        await confirmation.clickNextPage();

        // Verify simple send transaction is displayed
        await confirmation.checkDappInitiatedHeadingTitle();
        await confirmation.clickNextPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await signTypedDataConfirmation.verifySignTypedDataV3Info(
          SIGN_TYPED_DATA_V3_INFO,
        );
        await confirmation.clickPreviousPage();

        // Verify simple send transaction is displayed
        await confirmation.checkDappInitiatedHeadingTitle();
        await confirmation.clickPreviousPage();

        // Verify Sign Typed Data v3 confirmation is displayed
        await signTypedDataConfirmation.verifySignTypedDataInfo(
          SIGN_TYPED_DATA_V1_INFO,
        );
      },
    );
  });

  it('initiates multiple signatures and rejects all', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({ driver }: { driver: Driver }) => {
        const confirmation = new SignTypedData(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
        await testDapp.openTestDappPage();
        await queueSignatures(driver);

        await confirmation.clickRejectAll();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkFailedSignTypedData('User rejected the request.');
        await testDapp.checkFailedSignTypedDataV3('User rejected the request.');
        await testDapp.checkFailedSignTypedDataV4('User rejected the request.');
      },
    );
  });

  it('navigates between transactions, signatures, and snap dialogs', async function () {
    await withFixtures(
      {
        dappOptions: {
          numberOfTestDapps: 1,
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        driverOptions: { timeOut: 20000 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withSnapsPrivacyWarningAlreadyShown()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        testSpecificMock: mockDialogSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectDialogsButton',
          { url: DAPP_ONE_URL },
        );
        await testSnaps.scrollAndClickButton('confirmationButton');

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSignTypedDatav4();

        await createDappTransaction(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const confirmation = new TransactionConfirmation(driver);
        const signTypedDataConfirmation = new SignTypedData(driver);
        await confirmation.checkPageNumbers(1, 3);
        await confirmation.verifyConfirmationHeadingTitle();

        await confirmation.clickNextPage();
        await confirmation.checkPageNumbers(2, 3);
        await signTypedDataConfirmation.verifySignatureHeadingTitle(
          SIGN_TYPED_DATA_EXPECTED.heading,
        );

        await confirmation.clickNextPage();
        await confirmation.checkPageNumbers(3, 3);
        await confirmation.checkDappInitiatedHeadingTitle();

        await confirmation.clickPreviousPage();
        await confirmation.checkPageNumbers(2, 3);
        await signTypedDataConfirmation.verifySignatureHeadingTitle(
          SIGN_TYPED_DATA_EXPECTED.heading,
        );

        await confirmation.clickPreviousPage();
        await confirmation.checkPageNumbers(1, 3);
        await confirmation.verifyConfirmationHeadingTitle();
      },
    );
  });
});
