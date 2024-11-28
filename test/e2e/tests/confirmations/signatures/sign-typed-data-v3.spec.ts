import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Ganache } from '../../../seeder/ganache';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withTransactionEnvelopeTypeFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import SignTypedData from '../../../page-objects/pages/confirmations/redesign/sign-typed-data-confirmation';
import TestDapp from '../../../page-objects/pages/test-dapp';
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

describe('Confirmation Signature - Sign Typed Data V3 @no-mmi', function (this: Suite) {
  it('initiates and confirms', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        ganacheServer,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await (ganacheServer as Ganache).getAccounts();
        const publicAddress = addresses?.[0] as string;
        await initializePages(driver);

        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV3,
        );

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();

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
        });
        await assertVerifiedResults(driver, publicAddress);
      },
      mockSignatureApproved,
    );
  });

  it('initiates and rejects', async function () {
    await withTransactionEnvelopeTypeFixtures(
      this.test?.fullTitle(),
      TransactionEnvelopeType.legacy,
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await initializePages(driver);
        const confirmation = new SignTypedData(driver);

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
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();
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
  await testDapp.check_successSignTypedDataV3(publicAddress);
  await testDapp.verify_successSignTypedDataV3Result(
    '0x0a22f7796a2a70c8dc918e7e6eb8452c8f2999d1a1eb5ad714473d36270a40d6724472e5609948c778a07216bd082b60b6f6853d6354c731fd8ccdd3a2f4af261b',
  );
}
