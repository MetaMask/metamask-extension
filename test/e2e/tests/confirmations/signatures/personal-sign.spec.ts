import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../../helpers';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp, { SignatureType } from '../../../page-objects/pages/test-dapp';
import { login } from '../../../page-objects/flows/login.flow';
import PersonalSignConfirmation from '../../../page-objects/pages/confirmations/personal-sign-confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
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
        const accountDetailsModal = new AccountDetailsModal(driver);
        const confirmation = new PersonalSignConfirmation(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
        await testDapp.openTestDappAndTriggerSignature(
          SignatureType.PersonalSign,
        );

        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);

        await accountDetailsModal.clickAddressCopyButton();
        await accountDetailsModal.waitForAddressCopied();
        await accountDetailsModal.clickAccountDetailsModalCloseButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.pasteIntoEip747ContractAddressInput();

        await testDapp.assertEip747ContractAddressInputValue(WALLET_ADDRESS);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.verifyPersonalSignInfo();

        await confirmation.clickScrollToBottomButton();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await testDapp.verifyPersonalSignSuccess(publicAddress);

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

        await login(driver);
        await testDapp.openTestDappAndTriggerSignature(
          SignatureType.PersonalSign,
        );

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
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const publicAddress = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
        const confirmation = new PersonalSignConfirmation(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
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
        await testDapp.verifyPersonalSignSuccess(publicAddress);
      },
    );
  });
});
