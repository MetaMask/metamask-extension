import { type Page, type BrowserContext } from '@playwright/test';
import { test } from '../helpers/extension-loader';
import { CustodianTestClient } from '../custodian-hooks/hooks';
import { callTestDappBtn } from '../helpers/dapps-helpers';

const dappsTest = async (
  page: Page,
  context: BrowserContext,
  buttonId: string,
) => {
  // Connect to Saturn API
  const client = new CustodianTestClient();
  await client.setup();
  const signedTransactionTime = await callTestDappBtn(
    page,
    context,
    client,
    buttonId,
    true,
  );

  if (buttonId === 'signTypedDataV4') {
    // Sign Typed Data V4
    await client.signEIP721MessageV4(signedTransactionTime);
  } else if (buttonId === 'signTypedDataV3') {
    // Sign Typed Data V3
    await client.signEIP721MessageV3(signedTransactionTime);
  } else {
    // Personal Sign
    await client.signPersonalSignature(signedTransactionTime);
  }
};

// Important note:
// These tests must run in parallel to avoid flakiness as they relay on tx creation time (signedTransactionTime)
// to retrieve the tx from saturn
test.describe.configure({ mode: 'serial' });
test.describe('MMI dapps - Signature', () => {
  test('MMI connects to dapp, clicks "Personal Sign" button and confirm from custody @custodian_sign', async ({
    page,
    context,
  }) => {
    await dappsTest(page, context, 'personalSign');
  });

  test('MMI connects to dapp, clicks "Sign EIP712 V4" button and confirm from custody @custodian_signTypedData', async ({
    page,
    context,
  }) => {
    await dappsTest(page, context, 'signTypedDataV4');
  });

  test('MMI connects to dapp, clicks "Sign EIP712 V3" button and confirm from custody @custodian_signTypedData', async ({
    page,
    context,
  }) => {
    await dappsTest(page, context, 'signTypedDataV3');
  });
});
