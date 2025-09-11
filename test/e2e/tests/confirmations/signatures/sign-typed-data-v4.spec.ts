import { Suite } from 'mocha';
import { MockedEndpoint } from 'mockttp';
import { unlockWallet, WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  mockSignatureApproved,
  mockSignatureRejected,
  scrollAndConfirmAndAssertConfirm,
  withSignatureFixtures,
} from '../helpers';
import { TestSuiteArguments } from '../transactions/shared';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../../constants';
import SignTypedData from '../../../page-objects/pages/confirmations/redesign/sign-typed-data-confirmation';
import TestDapp from '../../../page-objects/pages/test-dapp';
import TestDappIndividualRequest from '../../../page-objects/pages/test-dapp-individual-request';
import { MetaMetricsRequestedThrough } from '../../../../../shared/constants/metametrics';
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

const signatureMessageWithoutVerifyingContract = [
  DEFAULT_FIXTURE_ACCOUNT,
  {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'version', type: 'string' },
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallets', type: 'address[]' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person[]' },
        { name: 'contents', type: 'string' },
        { name: 'attachment', type: 'bytes' },
      ],
    },
    primaryType: 'Mail',
    domain: {
      chainId: '0x539',
      name: 'Ether Mail',
      version: '1',
    },
    message: {
      contents: 'Hello, Bob!',
      from: {
        name: 'Cow',
        wallets: [
          '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
        ],
      },
      to: [
        {
          name: 'Bob',
          wallets: [
            '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
            '0xB0B0b0b0b0b0B000000000000000000000000000',
          ],
        },
      ],
      attachment: '0x',
    },
  },
];

describe('Confirmation Signature - Sign Typed Data V4', function (this: Suite) {
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
        await initializePages(driver);

        await openDappAndTriggerSignature(
          driver,
          SignatureType.SignTypedDataV4,
        );

        await clickHeaderInfoBtn(driver);
        await assertHeaderInfoBalance();

        await copyAddressAndPasteWalletAddress(driver);
        await assertPastedAddress();

        await assertInfoValues({ driver });
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
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await assertVerifiedResults(driver, publicAddress);
      },
      async (mockServer) => {
        return await mockSignatureApproved(mockServer, true);
      },
    );
  });

  it('initiates and rejects', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
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
          requestedThrough: MetaMetricsRequestedThrough.EthereumProvider,
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assertRejectedSignature();
      },
      async (mockServer) => {
        return await mockSignatureRejected(mockServer, true);
      },
    );
  });

  it('signs message with verifyingContract field missing', async function () {
    await withSignatureFixtures(
      this.test?.fullTitle(),
      async ({ driver }: TestSuiteArguments) => {
        await unlockWallet(driver);
        const testDappIndividualRequest = new TestDappIndividualRequest(driver);

        await testDappIndividualRequest.request(
          'eth_signTypedData_v4',
          signatureMessageWithoutVerifyingContract,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await assertInfoValues({ driver, verifyingContract: false });
        await scrollAndConfirmAndAssertConfirm(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.TestDappSendIndividualRequest,
        );

        await testDappIndividualRequest.checkExpectedResult(
          '0xdf05fb422b6623939c9ec6b622d21b97e3974cc8bf0d7534aa8e5972be4c1e954261493934ecd1088aa32f4b0686dc9a4a847bd51fb572aba1f69153035533781c',
        );
      },
    );
  });
});

async function assertInfoValues({
  driver,
  verifyingContract = true,
}: {
  driver: Driver;
  verifyingContract?: boolean;
}) {
  const signTypedData = new SignTypedData(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  if (verifyingContract) {
    await signTypedData.verifyContractPetName();
  }
  await signTypedData.verifyOrigin();
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
  await testDapp.checkSuccessSignTypedDataV4(publicAddress);
  await testDapp.verifySuccessSignTypedDataV4Result(
    '0xcd2f9c55840f5e1bcf61812e93c1932485b524ca673b36355482a4fbdf52f692684f92b4f4ab6f6c8572dacce46bd107da154be1c06939b855ecce57a1616ba71b',
  );
}
