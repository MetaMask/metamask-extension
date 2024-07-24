import FixtureBuilder from '../../fixture-builder';
import { withFixtures, unlockWallet } from '../../helpers';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { createBtcAccount } from '../../accounts/common';

const GENERATE_MOCK_BTC_BALANCE_CALL = (
  address: string = DEFAULT_BTC_ACCOUNT,
): { data: { [address: string]: number } } => {
  return {
    data: {
      [address]: 9999,
    },
  };
};

export async function mockBtcBalanceQuote(
  mockServer: Mockttp,
  address: string = DEFAULT_BTC_ACCOUNT,
) {
  return [
    await mockServer
      .forGet(/https:\/\/api\.blockchair\.com\/bitcoin\/addresses\/balances/u)
      .withQuery({
        addresses: address,
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: GENERATE_MOCK_BTC_BALANCE_CALL(address),
      })),
  ];
}

export async function withBtcAccountSnap(
  {
    title,
    bitcoinSupportEnabled,
  }: { title?: string; bitcoinSupportEnabled?: boolean },
  test: (driver: Driver) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPreferencesControllerAndFeatureFlag({
          bitcoinSupportEnabled: bitcoinSupportEnabled ?? true,
        })
        .build(),
      title,
      dapp: true,
      testSpecificMock: mockBtcBalanceQuote,
    },
    async ({ driver }: { driver: Driver }) => {
      await unlockWallet(driver);
      await createBtcAccount(driver);
      await test(driver);
    },
  );
}
