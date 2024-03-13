import { type Page, type BrowserContext } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { callTestDappBtn } from '../helpers/dapps-helpers';
import { MMIMainPage } from '../pageObjects/mmi-main-page';
import { CustodianTestClient } from '../custodian-hooks/hooks';

const dappsTest = async (
  page: Page,
  context: BrowserContext,
  buttonId: string,
) => {
  // Connect to Saturn API
  const client = new CustodianTestClient();
  await client.setup();
  const { dummyDApp } = await callTestDappBtn(page, context, client, buttonId);
  const mainPage = new MMIMainPage(page);
  // Rest of the test dapp buttons
  await mainPage.bringToFront();
  await mainPage.openActivityTab();
  await mainPage.checkLastTransactionStatus(/created/iu);
  const custodianTxId = await mainPage.getCustodianTXId();

  // Sign and submit
  const statusName = await client.submitTransactionById(custodianTxId);
  await mainPage.checkLastTransactionStatus(statusName);
  // Mined status not check as it makes tests flaky and it is blockchain performance dependent

  // check contract status in test dapp
  await dummyDApp.bringToFront();

  if (
    buttonId === 'showMeTheMoneyButton_sepolia' ||
    buttonId === 'useSuperPowers_sepolia'
  ) {
    await dummyDApp.checkContractStatus(/Called contract/iu);
  }
};

// Important note:
// These tests can run in parallel as they don't relay on tx creation time to retrieve the tx from saturn
test.describe('MMI dapps', () => {
  test.describe.configure({ mode: 'serial' });

  test('MMI connects to dapp, clicks "Show me the money" button and confirm from custody', async ({
    page,
    context,
  }) => {
    await dappsTest(page, context, 'showMeTheMoneyButton_sepolia');
  });

  test('MMI connects to dapp, clicks "Approve tokens" button and confirm from custody', async ({
    page,
    context,
  }) => {
    await dappsTest(page, context, 'approveTokens');
  });

  test('MMI connects to dapp, clicks "Use Super Powers" button, and confirm from custody', async ({
    page,
    context,
  }) => {
    await dappsTest(page, context, 'useSuperPowers_sepolia');
  });
});
