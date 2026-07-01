import { Driver } from '../../webdriver/driver';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import SendPage from '../pages/send/send-page';
import { TRON_CHAIN_ID } from '../../tests/tron/mocks/common-tron';
import { login } from './login.flow';
import { selectTronNetwork } from './tron-network.flow';

export async function landOnTronSendScreen({
  driver,
  symbol,
  assetId,
  expectedNativeBalance = '6.072',
}: {
  driver: Driver;
  symbol: 'TRX' | 'USDT' | 'USDD' | 'HTX' | 'SEED';
  assetId?: string;
  expectedNativeBalance?: string | null;
}): Promise<SendPage> {
  await login(driver, { validateBalance: false });
  await selectTronNetwork(driver);

  const home = new NonEvmHomepage(driver);
  await home.checkPageIsLoaded();
  // Wait for the live TRX balance to land on the homepage before navigating to
  // Send. Without this gate, Send opens with the cached "0 TRX available" and
  // every amount renders "Insufficient funds", leaving the Continue button
  // disabled. The local Tron node is seeded with 6.072 TRX in profiles.ts.
  if (expectedNativeBalance) {
    await home.checkExpectedTokenBalanceIsDisplayed(
      expectedNativeBalance,
      'TRX',
    );
  }

  const sendPage = new SendPage(driver);
  const searchParams = new URLSearchParams({ chainId: TRON_CHAIN_ID });
  if (assetId) {
    searchParams.set('asset', assetId);
  }
  await driver.openNewURL(
    `${driver.extensionUrl}/home.html#/send/amount-recipient?${searchParams.toString()}`,
  );
  await sendPage.checkSendFormIsLoaded();
  return sendPage;
}
