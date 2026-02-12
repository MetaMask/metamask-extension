import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import PersonalSignConfirmation from '../../../page-objects/pages/confirmations/personal-sign-confirmation';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import {
  openDappAndTriggerSignature,
  copyAddressAndPasteWalletAddress,
} from '../../../page-objects/flows/signature-confirmation.flow';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  WINDOW_TITLES,
} from '../../../constants';
import {
  assertAccountDetailsMetrics,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  WALLET_ADDRESS,
  WALLET_ETH_BALANCE,
  SignatureType,
} from './signature-helpers';

describe.only('Confirmation Signature - Personal Sign', function (this: Suite) {
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
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        const accountDetailsModal = new AccountDetailsModal(driver);

        await openDappAndTriggerSignature(driver, SignatureType.PersonalSign);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);

        await copyAddressAndPasteWalletAddress(driver);
        await testDapp.assertEip747ContractAddressInputValue(WALLET_ADDRESS);
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
        const testDapp = new TestDapp(driver);

        await openDappAndTriggerSignature(driver, SignatureType.PersonalSign);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await testDapp.assertUserRejectedRequest();

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
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const publicAddress = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
        const confirmation = new PersonalSignConfirmation(driver);
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

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

        await confirmation.checkPageNumbers(1, 2);
        await confirmation.verifyOrigin();
        await confirmation.verifyMessage();

        // Confirm first personal sign
        await confirmation.clickFooterConfirmButton();
        await confirmation.verifyRejectAllButtonNotPresent();

        // Confirm second personal sign
        await confirmation.clickFooterConfirmButton();

        // Verify the signature
        await testDapp.checkSuccessPersonalSign(publicAddress);
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

  await testDapp.checkSuccessPersonalSign(publicAddress);
  await testDapp.verifyPersonalSignSigUtilResult(publicAddress);
}
