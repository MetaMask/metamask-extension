import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApprovedWithDecoding,
  mockSignatureRejectedWithDecoding,
  scrollAndConfirmAndAssertConfirm,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import PermitConfirmation from '../../../page-objects/pages/confirmations/redesign/permit-confirmation';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import {
  assertAccountDetailsMetrics,
  assertPastedAddress,
  assertRejectedSignature,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  clickHeaderInfoBtn,
  copyAddressAndPasteWalletAddress,
  initializePages,
  openDappAndTriggerDeploy,
  SignatureType,
  triggerSignature,
} from './signature-helpers';

describe('Confirmation Signature - NFT Permit', function (this: Suite) {
  it('initiates and confirms and emits the correct events', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        localNodes,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        const addresses = await localNodes?.[0]?.getAccounts();
        const publicAddress = addresses?.[0] as string;
        await initializePages(driver);

        await openDappAndTriggerDeploy(driver);
        await driver.delay(1000);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await scrollAndConfirmAndAssertConfirm(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.delay(1000);
        await triggerSignature(SignatureType.NFTPermit);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await clickHeaderInfoBtn(driver);
        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await assertInfoValues(driver);
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.delay(1000);

        await assertAccountDetailsMetrics(
          driver,
          mockedEndpoints as MockedEndpoint[],
          'eth_signTypedData_v4',
        );

        await assertSignatureConfirmedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Permit',
          uiCustomizations: ['redesigned_confirmation', 'permit'],
          decodingChangeTypes: ['LISTING', 'RECEIVE'],
          decodingResponse: 'CHANGE',
          decodingDescription: null,
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await assertVerifiedResults(driver, publicAddress);
      },
      mockSignatureApprovedWithDecoding,
    );
  });

  it('initiates and rejects and emits the correct events', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await initializePages(driver);
        const confirmation = new PermitConfirmation(driver);
        await openDappAndTriggerDeploy(driver);
        await driver.delay(1000);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement('[data-testid="confirm-footer-button"]');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.delay(1000);
        await triggerSignature(SignatureType.NFTPermit);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Permit',
          uiCustomizations: ['redesigned_confirmation', 'permit'],
          location: 'confirmation',
          decodingChangeTypes: ['LISTING', 'RECEIVE'],
          decodingResponse: 'CHANGE',
          decodingDescription: null,
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });
      },
      mockSignatureRejectedWithDecoding,
    );
  });
});

async function assertInfoValues(driver: Driver) {
  const confirmation = new PermitConfirmation(driver);
  await confirmation.clickCollapseSectionButton();
  await confirmation.verifyOrigin();
  await confirmation.verifyNftContractPetName();
  await confirmation.verifyNftTitle();
  await confirmation.verifyNftDescription();
  await confirmation.verifyNftPrimaryType();
  await confirmation.verifyNftSpender();
  await confirmation.verifyNftTokenId();
  await confirmation.verifyNftNonce();
  await confirmation.verifyNftDeadline();
}

async function assertVerifiedResults(driver: Driver, publicAddress: string) {
  const testDapp = new TestDapp(driver);
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.checkSuccessSign721Permit(publicAddress);
  await testDapp.verifySign721PermitResult(
    '0x572bc6300f6aa669e85e0a7792bc0b0803fb70c3c492226b30007ff7030b03600e390ef295a5a525d19f444943ae82697f0e5b5b0d77cc382cb2ea9486ec27801c',
  );
  await testDapp.verifySign721PermitResultR(
    '0x572bc6300f6aa669e85e0a7792bc0b0803fb70c3c492226b30007ff7030b0360',
  );
  await testDapp.verifySign721PermitResultS(
    '0x0e390ef295a5a525d19f444943ae82697f0e5b5b0d77cc382cb2ea9486ec2780',
  );
  await testDapp.verifySign721PermitResultV('28');
  await driver.clickElement('#sign721PermitVerify');
}
