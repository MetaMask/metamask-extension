import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { DAPP_HOST_ADDRESS, WINDOW_TITLES } from '../../../constants';
import {
  mockPermitDecoding,
  mockSignatureApprovedWithDecoding,
  mockSignatureRejectedWithDecoding,
  scrollAndConfirmAndAssertConfirm,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import TestDapp, { SignatureType } from '../../../page-objects/pages/test-dapp';
import { login } from '../../../page-objects/flows/login.flow';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import PermitConfirmation, {
  PermitInfoValues,
} from '../../../page-objects/pages/confirmations/permit-confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/accountDetailsModal';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
import {
  assertAccountDetailsMetrics,
  assertSignatureConfirmedMetrics,
  assertSignatureRejectedMetrics,
  WALLET_ETH_BALANCE,
} from './signature-helpers';

const TOKEN_PERMIT_INFO: PermitInfoValues = {
  contractPetName: '0xCcCCc...ccccC',
  deadline: '09 June 3554, 16:53',
  nonce: '0',
  origin: DAPP_HOST_ADDRESS,
  ownerName: 'Account 1',
  primaryType: 'Permit',
  spenderAddress: '0x5B38D...eddC4',
  value: '3,000',
};

const TOKEN_PERMIT_SIGNATURE = {
  r: '0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d73',
  s: '0x0103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea49',
  signature:
    '0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d730103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea491b',
  v: '27',
} as const;

describe('Confirmation Signature - Permit', function (this: Suite) {
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
        const confirmation = new Confirmation(driver);
        const permitConfirmation = new PermitConfirmation(driver);
        const accountDetailsModal = new AccountDetailsModal(driver);
        const testDapp = new TestDapp(driver);

        await login(driver);
        await testDapp.openTestDappAndTriggerSignature(SignatureType.Permit);

        await confirmation.clickHeaderAccountDetailsButton();
        await accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);
        await accountDetailsModal.clickAccountDetailsModalCloseButton();

        await permitConfirmation.checkInfoValues(TOKEN_PERMIT_INFO);
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
          uiCustomizations: ['permit'],
          decodingChangeTypes: ['RECEIVE', 'LISTING'],
          decodingResponse: 'CHANGE',
          decodingDescription: null,
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkSuccessSignPermit(publicAddress);
        await testDapp.verifySignPermitResult(TOKEN_PERMIT_SIGNATURE.signature);
        await testDapp.verifySignPermitResultR(TOKEN_PERMIT_SIGNATURE.r);
        await testDapp.verifySignPermitResultS(TOKEN_PERMIT_SIGNATURE.s);
        await testDapp.verifySignPermitResultV(TOKEN_PERMIT_SIGNATURE.v);
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
        const testDapp = new TestDapp(driver);
        const confirmation = new Confirmation(driver);
        await login(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickPermit();
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

  it('display decoding information if available', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        const testDapp = new TestDapp(driver);
        await login(driver);
        await testDapp.openTestDappAndTriggerSignature(SignatureType.Permit);

        const simulationSection = driver.findElement({
          text: 'Estimated changes',
        });
        const receiveChange = driver.findElement({ text: 'Listing price' });
        const listChange = driver.findElement({ text: 'You list' });
        const listChangeValue = driver.findElement({ text: '#2101' });

        assert.ok(await simulationSection, 'Estimated changes');
        assert.ok(await receiveChange, 'Listing price');
        assert.ok(await listChange, 'You list');
        assert.ok(await listChangeValue, '#2101');

        await driver.delay(10000);
      },
      mockPermitDecoding,
    );
  });
});
