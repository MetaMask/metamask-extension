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
import SignTypedData from '../../../page-objects/pages/confirmations/sign-typed-data-confirmation';
import TestDapp from '../../../page-objects/pages/test-dapp';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import {
  openDappAndTriggerSignature,
  copyAddressAndPasteWalletAddress,
} from '../../../page-objects/flows/signature-confirmation.flow';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import {
  assertAccountDetailsMetrics,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  WALLET_ADDRESS,
  WALLET_ETH_BALANCE,
  SignatureType,
} from './signature-helpers';

describe('Confirmation Signature - Sign Typed Data V3', function (this: Suite) {
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
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        const accountDetailsModal = new AccountDetailsModal(driver);

        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV3,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);

        await copyAddressAndPasteWalletAddress(driver);
        await testDapp.assertEip747ContractAddressInputValue(WALLET_ADDRESS);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v3',
        );
        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v3',
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

        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV3,
        );

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v3',
          location: 'confirmation',
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

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
  await signTypedData.verifyOrigin();
  await signTypedData.verifyContractPetName();
  await signTypedData.verifyPrimaryType();
  await signTypedData.verifyFromName();
  await signTypedData.verifyFromAddress();
  await signTypedData.verifyToName();
  await signTypedData.verifyToAddress();
  await signTypedData.verifyContents();
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  const testDapp = new TestDapp(driver);
  await driver.waitUntilXWindowHandles(2);
  await testDapp.checkSuccessSignTypedDataV3(publicAddress);
  await testDapp.verifySuccessSignTypedDataV3Result(
    '0x0a22f7796a2a70c8dc918e7e6eb8452c8f2999d1a1eb5ad714473d36270a40d6724472e5609948c778a07216bd082b60b6f6853d6354c731fd8ccdd3a2f4af261b',
  );
}
