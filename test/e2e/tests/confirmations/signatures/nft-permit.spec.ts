import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { WINDOW_TITLES, DAPP_HOST_ADDRESS } from '../../../constants';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApprovedWithDecoding,
  mockSignatureRejectedWithDecoding,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import PermitConfirmation from '../../../page-objects/pages/confirmations/permit-confirmation';
import TestDapp, { SignatureType } from '../../../page-objects/pages/test-dapp';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import { login } from '../../../page-objects/flows/login.flow';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import {
  assertAccountDetailsMetrics,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
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
        const testDapp = new TestDapp(driver);
        const confirmation = new PermitConfirmation(driver);
        const accountDetailsModal = new AccountDetailsModal(driver);

        await login(driver);
        await testDapp.openTestDappAndTriggerDeploy();
        await confirmation.clickScrollToBottomButton();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.triggerSignature(SignatureType.NFTPermit);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.checkPageIsLoaded();
        await accountDetailsModal.clickAccountDetailsModalCloseButton();

        await assertInfoValues(driver);
        await confirmation.clickScrollToBottomButton();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

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
          uiCustomizations: ['permit'],
          decodingChangeTypes: ['RECEIVE', 'LISTING'],
          decodingResponse: 'CHANGE',
          decodingDescription: null,
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await assertVerifiedResults(driver, testDapp, publicAddress);
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
        const confirmation = new PermitConfirmation(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
        await testDapp.openTestDappAndTriggerDeploy();
        await confirmation.clickScrollToBottomButton();
        await confirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.triggerSignature(SignatureType.NFTPermit);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await confirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await testDapp.assertUserRejectedRequest();

        await assertSignatureRejectedMetrics({
          driver,
          mockedEndpoints: mockedEndpoints as MockedEndpoint[],
          signatureType: 'eth_signTypedData_v4',
          primaryType: 'Permit',
          uiCustomizations: ['permit'],
          location: 'confirmation',
          decodingChangeTypes: ['RECEIVE', 'LISTING'],
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
  const contractAddress = '0x581c3...45947';
  const title = 'Withdrawal request';
  const description = 'This site wants permission to withdraw your NFTs';
  const tokenId = '3606393';
  const nonce = '0';
  const deadline = '23 December 2024, 23:03';

  await confirmation.clickCollapseSectionButton();
  await confirmation.checkOrigin(DAPP_HOST_ADDRESS);
  await confirmation.checkAddressValue(contractAddress);
  await confirmation.checkTitle(title);
  await confirmation.checkDescription(description);
  await confirmation.checkPrimaryType('Permit');
  await confirmation.checkAddressValue(contractAddress);
  await confirmation.checkDataTreeField('tokenId', tokenId);
  await confirmation.checkDataTreeField('nonce', nonce);
  await confirmation.checkDataTreeField('deadline', deadline);
}

async function assertVerifiedResults(
  driver: Driver,
  testDapp: TestDapp,
  publicAddress: string,
) {
  const expectedSignature =
    '0x572bc6300f6aa669e85e0a7792bc0b0803fb70c3c492226b30007ff7030b03600e390ef295a5a525d19f444943ae82697f0e5b5b0d77cc382cb2ea9486ec27801c';
  const expectedR =
    '0x572bc6300f6aa669e85e0a7792bc0b0803fb70c3c492226b30007ff7030b0360';
  const expectedS =
    '0x0e390ef295a5a525d19f444943ae82697f0e5b5b0d77cc382cb2ea9486ec2780';
  const expectedV = '28';

  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.checkSuccessSign721Permit(publicAddress);
  await testDapp.verifySign721PermitResult(expectedSignature);
  await testDapp.verifySign721PermitResultR(expectedR);
  await testDapp.verifySign721PermitResultS(expectedS);
  await testDapp.verifySign721PermitResultV(expectedV);
}
