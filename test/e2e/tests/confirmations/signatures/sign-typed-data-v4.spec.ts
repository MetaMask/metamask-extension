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

describe('Confirmation Signature - Sign Typed Data V4 @no-mmi', function (this: Suite) {
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
          SignatureType.SignTypedDataV4,
        );

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v4',
        );

        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Mail',
          withAnonEvents: true,
        });

        await assertVerifiedResults(driver, publicAddress);
      },
      async (mockServer) => {
        return await mockSignatureApproved(mockServer, true);
      },
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
          SignatureType.SignTypedDataV4,
        );

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Mail',
          location: 'confirmation',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();
      },
      async (mockServer) => {
        return await mockSignatureRejected(mockServer, true);
      },
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
  await signTypedData.verifyAttachment();
  await signTypedData.verifyToAddressNum2();
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  const testDapp = new TestDapp(driver);
  await driver.waitUntilXWindowHandles(2);
  await testDapp.check_successSignTypedDataV4(publicAddress);
  await testDapp.verify_successSignTypedDataV4Result(
    '0xcd2f9c55840f5e1bcf61812e93c1932485b524ca673b36355482a4fbdf52f692684f92b4f4ab6f6c8572dacce46bd107da154be1c06939b855ecce57a1616ba71b',
  );
}
