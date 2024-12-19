import { Mockttp } from 'mockttp';
import { withFixtures, unlockWallet } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import { ACCOUNT_TYPE } from '../../page-objects/common';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { DEFAULT_SOL_CONVERSION_RATE } from '../../constants';

const SOLANA_URL_REGEX = /^https:\/\/.*\..*/u;
const SOLANA_PRICE_REGEX =
  /^https:\/\/price-api\.metamask-institutional\.io\/v2\/chains\/solana:/u;

export enum SendFlowPlaceHolders {
  AMOUNT = 'Enter amount to send',
  RECIPIENT = 'Enter receiving address',
  LOADING = 'Preparing transaction',
}

export const SOL_BALANCE = 500;

export const SOL_TO_USD_RATE = 225.88;

export const USD_BALANCE = SOL_BALANCE * SOL_TO_USD_RATE;

export async function mockSolanaBalanceQuote(mockServer: Mockttp) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getBalance',
    })
    .thenCallback(() => {
      console.log('Entra?');
      return {
        statusCode: 200,
        json: {
          result: {
            context: {
              apiVersion: '2.0.18',
              slot: 308460925,
            },
            value: SOL_BALANCE,
          },
        },
      };
    });
}

export async function mockSolanaRatesCall(mockServer: Mockttp) {
  return await mockServer
    .forGet(SOLANA_PRICE_REGEX)
    .withQuery({ vsCurrency: 'usd' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: 'wrapped-solana',
          price: 210.57,
          marketCap: 0,
          allTimeHigh: 263.68,
          allTimeLow: 8.11,
          totalVolume: 3141761864,
          high1d: 218.26,
          low1d: 200.85,
          circulatingSupply: 0,
          dilutedMarketCap: 124394527657,
          marketCapPercentChange1d: 0,
          priceChange1d: -7.68288033909846,
          pricePercentChange1h: 0.5794201955743261,
          pricePercentChange1d: -3.520101943578202,
          pricePercentChange7d: -8.192700158252544,
          pricePercentChange14d: -12.477367449577399,
          pricePercentChange30d: -14.588630064677465,
          pricePercentChange200d: 28.111509321033513,
          pricePercentChange1y: 181.48381055890258,
        },
      };
    });
}

export async function withSolanaAccountSnap(
  {
    title,
    solanaSupportEnabled,
  }: { title?: string; solanaSupportEnabled?: boolean },
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
) {
  console.log('Starting withSolanaAccountSnap');
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPreferencesControllerAndFeatureFlag({
          solanaSupportEnabled: solanaSupportEnabled ?? true,
        })
        .build(),
      title,
      dapp: true,
      testSpecificMock: async (mockServer: Mockttp) => {
        console.log('Setting up test-specific mocks');
        return [
          await mockSolanaBalanceQuote(mockServer),
          await mockSolanaRatesCall(mockServer),
        ];
      },
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithBalanceValidation(driver);
      const headerComponen = new HeaderNavbar(driver);
      await headerComponen.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.addAccount(ACCOUNT_TYPE.Solana, 'Solana 1');
      await test(driver, mockServer);
    },
  );
}
