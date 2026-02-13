import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../constants';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import PersonalSignConfirmation from '../../../page-objects/pages/confirmations/personal-sign-confirmation';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import TestDapp from '../../../page-objects/pages/test-dapp';
import {
  openDappAndTriggerSignature,
  copyAddressAndPasteWalletAddress,
  assertVerifiedSiweMessage,
} from '../../../page-objects/flows/signature-confirmation.flow';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import {
  assertAccountDetailsMetrics,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  WALLET_ADDRESS,
  WALLET_ETH_BALANCE,
  SignatureType,
} from './signature-helpers';

describe('Confirmation Signature - SIWE', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        const accountDetailsModal = new AccountDetailsModal(driver);

        await openDappAndTriggerSignature(driver, SignatureType.SIWE);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);

        await copyAddressAndPasteWalletAddress(driver);
        await testDapp.assertEip747ContractAddressInputValue(WALLET_ADDRESS);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);

        await assertVerifiedSiweMessage(
          driver,
          '0xef8674a92d62a1876624547bdccaef6c67014ae821de18fa910fbff56577a65830f68848585b33d1f4b9ea1c3da1c1b11553b6aabe8446717daf7cd1e38a68271c',
        );

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'personal_sign',
        );

        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          uiCustomizations: ['sign_in_with_ethereum'],
          securityAlertReason: BlockaidReason.notApplicable,
          securityAlertResponse: BlockaidResultType.NotApplicable,
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

        await openDappAndTriggerSignature(driver, SignatureType.SIWE);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await testDapp.assertUserRejectedRequest();
        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'personal_sign',
          uiCustomizations: ['sign_in_with_ethereum'],
          location: 'confirmation',
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
          securityAlertReason: BlockaidReason.notApplicable,
          securityAlertResponse: BlockaidResultType.NotApplicable,
        });
      },
      mockSignatureRejected,
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const confirmation = new PersonalSignConfirmation(driver);
  await confirmation.verifyOrigin();
  await confirmation.checkSiweMessage();
}
