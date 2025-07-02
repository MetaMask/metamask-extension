import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { unlockWallet, WINDOW_TITLES, withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp from '../../../page-objects/pages/test-dapp';
import PersonalSignConfirmation from '../../../page-objects/pages/confirmations/redesign/personal-sign-confirmation';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import FixtureBuilder from '../../../fixture-builder';
import { DEFAULT_FIXTURE_ACCOUNT_LOWERCASE } from '../../../constants';
import {
  assertAccountDetailsMetrics,
  assertHeaderInfoBalance,
  assertPastedAddress,
  assertRejectedSignature,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  initializePages,
  openDappAndTriggerSignature,
  SignatureType,
} from './signature-helpers';

describe('Confirmation Signature - Personal Sign', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        localNodes,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await localNodes?.[0]?.getAccounts();
        const publicAddress = addresses?.[0].toLowerCase() as string;
        await initializePages(driver);

        await openDappAndTriggerSignature(driver, SignatureType.PersonalSign);

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await assertInfoValues(driver);

        await scrollAndConfirmAndAssertConfirm(driver);

        await assertVerifiedPersonalMessage(driver, publicAddress);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );
        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });
      },
      mockSignatureApproved,
    );
  });

  it('initiates and rejects', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const confirmation = new PersonalSignConfirmation(driver);

        await initializePages(driver);
        await openDappAndTriggerSignature(driver, SignatureType.PersonalSign);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          location: 'confirmation',
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });
      },
      mockSignatureRejected,
    );
  });

  it('can queue multiple personal signs and confirm', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const publicAddress = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
        const confirmation = new PersonalSignConfirmation(driver);
        await unlockWallet(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        // Create first personal sign
        await testDapp.clickPersonalSign();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.verifyConfirmationHeadingTitle();

        // Switch to Dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Create second personal sign
        await testDapp.clickPersonalSign();

        // Switch to confirmation window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await confirmation.check_pageNumbers(1, 2);
        await confirmation.verifyOrigin();
        await confirmation.verifyMessage();

        // Confirm first personal sign
        await confirmation.clickFooterConfirmButton();
        await confirmation.verifyRejectAllButtonNotPresent();

        // Confirm second personal sign
        await confirmation.clickFooterConfirmButton();

        // Verify the signature
        await testDapp.check_successPersonalSign(publicAddress);
        await testDapp.verifyPersonalSignSigUtilResult(publicAddress);
      },
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const personalSignConfirmation = new PersonalSignConfirmation(driver);
  personalSignConfirmation.verifyOrigin();
  personalSignConfirmation.verifyMessage();
}

async function assertVerifiedPersonalMessage(
  driver: Driver,
  publicAddress: string,
) {
  const testDapp = new TestDapp(driver);
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.check_successPersonalSign(publicAddress);
  await testDapp.verifyPersonalSignSigUtilResult(publicAddress);
}
