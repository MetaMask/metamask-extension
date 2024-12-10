import { Mockttp } from 'mockttp';
import { withFixtures, unlockWallet } from '../../helpers';
import { DEFAULT_SOLANA_ACCOUNT } from '../../constants';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage, { AccountType } from '../../page-objects/pages/account-list-page';
import FixtureBuilder = require('../../fixture-builder');

const SOLANA_URL_REGEX = /^https:\/\/.*\.solana.*/;

export enum SendFlowPlaceHolders {
  AMOUNT = 'Enter amount to send',
  RECIPIENT = 'Enter receiving address',
  LOADING = 'Preparing transaction',
}


export async function mockSolanaBalanceQuote(
  mockServer: Mockttp,
  address: string = DEFAULT_SOLANA_ACCOUNT,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({
      method: 'getBalance',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          result: {
            context: {
              apiVersion: '2.0.15',
              slot: 305352614
            },
            value: 0,
          },
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
  await withFixtures(
    {
      fixtures: new FixtureBuilder()
        .withPreferencesControllerAndFeatureFlag({
          solanaSupportEnabled: solanaSupportEnabled ?? true,
        })
        .build(),
      title,
      dapp: true,
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockSolanaBalanceQuote(mockServer),
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await unlockWallet(driver);
      const headerComponen = new HeaderNavbar(driver);
      await headerComponen.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.openAddAccountModal();
      await accountListPage.addNewSolanaAccount();
      await test(driver, mockServer);
    },
  );
}