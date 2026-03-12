import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../constants';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import SignTypedData from '../../../page-objects/pages/confirmations/sign-typed-data-confirmation';
import TestDapp, { SignatureType } from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import {
  assertAccountDetailsMetrics,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  WALLET_ETH_BALANCE,
} from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        localNodes,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await localNodes?.[0]?.getAccounts();
        const publicAddress = addresses?.[0] as string;
        const confirmation = new Confirmation(driver);
        const accountDetailsModal = new AccountDetailsModal(driver);
        const testDapp = new TestDapp(driver);

        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappAndTriggerSignature(
          SignatureType.SignTypedData,
        );

        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);
        await accountDetailsModal.clickAccountDetailsModalCloseButton();

        await assertInfoValues(driver);

        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData',
        );

        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData',
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await assertVerifiedResults(driver, publicAddress);
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
        const confirmation = new SignTypedData(driver);
        const testDapp = new TestDapp(driver);

        await loginWithBalanceValidation(driver);
        await testDapp.openTestDappAndTriggerSignature(
          SignatureType.SignTypedData,
        );

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData',
          location: 'confirmation',
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await testDapp.assertUserRejectedRequest();
      },
      mockSignatureRejected,
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const signTypedData = new SignTypedData(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await signTypedData.verifySignTypedDataMessage();
  await signTypedData.verifyOrigin();
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  await driver.waitUntilXWindowHandles(2);
  const testDapp = new TestDapp(driver);
  await testDapp.checkSuccessSignTypedData(publicAddress);
  await testDapp.verifySuccessSignTypedDataResult(
    '0x32791e3c41d40dd5bbfb42e66cf80ca354b0869ae503ad61cd19ba68e11d4f0d2e42a5835b0bfd633596b6a7834ef7d36033633a2479dacfdb96bda360d51f451b',
  );
}
