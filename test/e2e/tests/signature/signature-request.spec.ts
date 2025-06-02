import SignTypedData from '../../page-objects/pages/confirmations/redesign/sign-typed-data-confirmation';

import {
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDapp from '../../page-objects/pages/test-dapp';
import { Driver } from '../../webdriver/driver';

const signatureRequestType = {
  signTypedData: 'Sign Typed Data',
  signTypedDataV3: 'Sign Typed Data V3',
  signTypedDataV4: 'Sign Typed Data V4',
};

const testData = [
  {
    type: signatureRequestType.signTypedData,
  },
  {
    type: signatureRequestType.signTypedDataV3,
  },
  {
    type: signatureRequestType.signTypedDataV4,
  },
];

describe('Sign Typed Data Signature Request', function () {
  testData.forEach((data) => {
    it(`can queue multiple Signature Requests of ${data.type} and confirm`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, localNodes }) => {
          const confirmation = new SignTypedData(driver);
          const addresses = await localNodes[0].getAccounts();
          const publicAddress = addresses[0].toLowerCase();
          await unlockWallet(driver);

          await openDapp(driver);

          // creates multiple sign typed data signature requests
          await triggerSignatureRequest(driver, data.type);

          await driver.waitUntilXWindowHandles(3);
          const windowHandles = await driver.getAllWindowHandles();
          // switches to Dapp
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
          // creates second sign typed data signature request
          await triggerSignatureRequest(driver, data.type);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          await confirmation.check_pageNumbers(1, 2);

          await verifyAndAssertRedesignedSignTypedData(driver, data.type);

          // Approve signing typed data
          await finalizeSignatureRequest(driver, 'Confirm');
          await driver.waitUntilXWindowHandles(3);

          // Approve signing typed data
          await finalizeSignatureRequest(driver, 'Confirm');
          await driver.waitUntilXWindowHandles(2);

          // switch to the Dapp and verify the signed address for each request
          await driver.switchToWindowWithTitle('E2E Test Dapp');
          await verifySignatureResult(driver, data.type, publicAddress);
        },
      );
    });
  });

  testData.forEach((data) => {
    it(`can initiate and reject a Signature Request of ${data.type}`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await openDapp(driver);

          // creates a sign typed data signature request
          await triggerSignatureRequest(driver, data.type);

          await driver.waitUntilXWindowHandles(3);
          let windowHandles = await driver.getAllWindowHandles();
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          // Reject signing typed data
          await finalizeSignatureRequest(driver, 'Reject');
          await driver.waitUntilXWindowHandles(2);
          windowHandles = await driver.getAllWindowHandles();

          // switch to the Dapp and verify the rejection was successful
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
          await verifySignatureRejection(driver, data.type);
        },
      );
    });
  });

  testData.forEach((data) => {
    it(`can queue multiple Signature Requests of ${data.type} and reject`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          const confirmation = new SignTypedData(driver);
          await unlockWallet(driver);

          await openDapp(driver);

          // creates multiple sign typed data signature requests
          await triggerSignatureRequest(driver, data.type);

          await driver.waitUntilXWindowHandles(3);
          const windowHandles = await driver.getAllWindowHandles();
          // switches to Dapp
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
          // creates second sign typed data signature request
          await triggerSignatureRequest(driver, data.type);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          await confirmation.check_pageNumbers(1, 2);

          // reject first signature request
          await finalizeSignatureRequest(driver, 'Reject');
          await driver.waitUntilXWindowHandles(3);

          // reject second signature request
          await finalizeSignatureRequest(driver, 'Reject');
          await driver.waitUntilXWindowHandles(2);

          // switch to the Dapp and verify the rejection was successful
          await driver.switchToWindowWithTitle('E2E Test Dapp');
          await verifySignatureRejection(driver, data.type);
        },
      );
    });
  });
});

async function triggerSignatureRequest(driver: Driver, type: string) {
  const testDapp = new TestDapp(driver);

  switch (type) {
    case signatureRequestType.signTypedData:
      await testDapp.clickSignTypedData();
      break;
    case signatureRequestType.signTypedDataV3:
      await testDapp.clickSignTypedDatav3();
      break;
    case signatureRequestType.signTypedDataV4:
      await testDapp.clickSignTypedDatav4();
      break;
    default:
      throw new Error(`Unsupported signature type: ${type}`);
  }
}

async function verifySignatureResult(
  driver: Driver,
  type: string,
  publicAddress: string,
) {
  const testDapp = new TestDapp(driver);

  switch (type) {
    case signatureRequestType.signTypedData:
      await testDapp.check_successSignTypedData(publicAddress);
      break;
    case signatureRequestType.signTypedDataV3:
      await testDapp.check_successSignTypedDataV3(publicAddress);
      break;
    case signatureRequestType.signTypedDataV4:
      await testDapp.check_successSignTypedDataV4(publicAddress);
      break;
    default:
      throw new Error(`Unsupported signature type: ${type}`);
  }
}

async function verifySignatureRejection(driver: Driver, type: string) {
  const testDapp = new TestDapp(driver);

  switch (type) {
    case signatureRequestType.signTypedData:
      await testDapp.check_failedSignTypedData(
        'Error: User rejected the request.',
      );
      break;
    case signatureRequestType.signTypedDataV3:
      await testDapp.check_failedSignTypedDataV3(
        'Error: User rejected the request.',
      );
      break;
    case signatureRequestType.signTypedDataV4:
      await testDapp.check_failedSignTypedDataV4(
        'Error: User rejected the request.',
      );
      break;
    default:
      throw new Error(`Unsupported signature type: ${type}`);
  }
}

async function verifyAndAssertRedesignedSignTypedData(
  driver: Driver,
  type: string,
) {
  const confirmation = new SignTypedData(driver);
  await confirmation.verifyConfirmationHeadingTitle();
  await confirmation.verifyOrigin();

  switch (type) {
    case signatureRequestType.signTypedData:
      await confirmation.verifySignTypedDataMessage();
      break;
    case signatureRequestType.signTypedDataV3:
    case signatureRequestType.signTypedDataV4:
      await confirmation.verifyContents();
      break;
    default:
      throw new Error(`Unsupported signature type: ${type}`);
  }
}

async function finalizeSignatureRequest(driver: Driver, action: string) {
  const confirmation = new SignTypedData(driver);
  await confirmation.clickScrollToBottomButton();

  if (action === 'Confirm') {
    await confirmation.clickFooterConfirmButton();
  } else if (action === 'Reject') {
    await confirmation.clickFooterCancelButton();
  } else {
    throw new Error(`Unsupported action: ${action}`);
  }
}
