import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { MockedEndpoint } from '../../mock-e2e';

export const FEATURE_FLAGS_URL =
  'https://client-config.api.cx.metamask.io/v1/flags';

export enum AccountType {
  MultiSRP = 'multi-srp',
  SSK = 'ssk',
  HardwareWallet = 'hardware-wallet',
}

export const mockMultichainAccountsFeatureFlag = (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            enableMultichainAccounts: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '12.19.0',
            },
          },
        ],
      };
    });

export async function withMultichainAccountsDesignEnabled(
  {
    title,
    testSpecificMock = mockMultichainAccountsFeatureFlag,
    accountType = AccountType.MultiSRP,
  }: {
    title?: string;
    testSpecificMock?: (mockServer: Mockttp) => Promise<MockedEndpoint>;
    accountType?: AccountType;
  },
  test: (driver: Driver) => Promise<void>,
) {
  let fixture;

  switch (accountType) {
    case AccountType.MultiSRP:
      fixture = new FixtureBuilder().withKeyringControllerMultiSRP().build();
      break;
    case AccountType.SSK:
      fixture = new FixtureBuilder().withKeyringControllerMultiSRP().build();
      break;
    case AccountType.HardwareWallet:
      fixture = new FixtureBuilder().withLedgerAccount().build();
      break;
    default:
      fixture = new FixtureBuilder().withKeyringControllerMultiSRP().build();
  }

  await withFixtures(
    {
      fixtures: fixture,
      testSpecificMock,
      title,
      dapp: true,
    },
    async ({ driver }: { driver: Driver; mockServer: Mockttp }) => {
      if (accountType === AccountType.HardwareWallet) {
        await loginWithoutBalanceValidation(driver);
      } else {
        await loginWithBalanceValidation(driver);
      }
      const homePage = new HomePage(driver);
      await homePage.check_pageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await test(driver);
    },
  );
}

const DUMMY_PRIVATE_KEY =
  '0x1111111111111111111111111111111111111111111111111111111111111111';

export async function withImportedAccount(
  options: {
    title?: string;
    testSpecificMock?: (mockServer: Mockttp) => Promise<MockedEndpoint>;
    privateKey?: string;
  },
  test: (driver: Driver) => Promise<void>,
) {
  await withMultichainAccountsDesignEnabled(options, async (driver) => {
    const accountListPage = new AccountListPage(driver);
    await accountListPage.addNewImportedAccount(
      options.privateKey ?? DUMMY_PRIVATE_KEY,
    );
    await test(driver);
  });
}
