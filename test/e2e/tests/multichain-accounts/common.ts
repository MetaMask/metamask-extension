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

import { E2E_SRP } from '../../default-fixture';
import {
  mockMultichainAccountsFeatureFlagDisabled,
  mockMultichainAccountsFeatureFlag,
  mockMultichainAccountsFeatureFlagStateTwo,
} from './feature-flag-mocks';
import { MockedDiscoveryBuilder } from './discovery';
import { SECOND_TEST_E2E_SRP } from '../../flask/multi-srp/common-multi-srp';

export enum AccountType {
  MultiSRP = 'multi-srp',
  SSK = 'ssk',
  HardwareWallet = 'hardware-wallet',
}

export async function withMultichainAccountsDesignEnabled(
  {
    title,
    testSpecificMock,
    accountType = AccountType.MultiSRP,
    state = 2,
    dappOptions,
    shouldMockDiscovery = true,
    withFixtures: withMoreFixtures,
  }: {
    title?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<MockedEndpoint | MockedEndpoint[] | void>;
    accountType?: AccountType;
    state?: number;
    dappOptions?: { numberOfTestDapps?: number; customDappPaths?: string[] };
    shouldMockDiscovery?: boolean;
    withFixtures?: (builder: FixtureBuilder) => FixtureBuilder;
  },
  test: (driver: Driver) => Promise<void>,
) {
  let fixtureBuilder = new FixtureBuilder();
  let srps: string[] = [];

  switch (accountType) {
    case AccountType.HardwareWallet:
      fixtureBuilder = fixtureBuilder.withLedgerAccount();
      srps = [E2E_SRP];
      break;
    case AccountType.SSK:
    case AccountType.MultiSRP:
    default:
      fixtureBuilder = fixtureBuilder.withKeyringControllerMultiSRP();
      srps = [E2E_SRP, SECOND_TEST_E2E_SRP];
  }

  if (withMoreFixtures) {
    fixtureBuilder = withMoreFixtures(fixtureBuilder);
  }

  const mockNetworkCalls = async (mockServer: Mockttp) => {
    if (shouldMockDiscovery) {
      for (const srp of srps) {
        await MockedDiscoveryBuilder.from(srp)
          .skipDefaultGroupIndex()
          .mock(mockServer);
      }
    }

    await testSpecificMock?.(mockServer);
  };

  await withFixtures(
    {
      fixtures: fixtureBuilder.build(),
      testSpecificMock: mockNetworkCalls,
      title,
      forceBip44Version: state === 2 ? 2 : 0,
      dappOptions,
    },
    async ({ driver }: { driver: Driver; mockServer: Mockttp }) => {
      // State 2 uses unified account group balance (fiat) and may not equal '25 ETH'.
      // Skip strict balance validation for hardware wallets and state 2 flows.
      if (accountType === AccountType.HardwareWallet || state === 2) {
        await loginWithoutBalanceValidation(driver);
      } else {
        await loginWithBalanceValidation(driver);
      }
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);

      if (state === 1) {
        await headerNavbar.openAccountMenu();
      } else {
        await headerNavbar.openAccountsPage();
      }

      const accountListPage = new AccountListPage(driver);

      if (state === 1) {
        await accountListPage.checkPageIsLoaded();
      }
      await test(driver);
    },
  );
}

const DUMMY_PRIVATE_KEY =
  '0x1111111111111111111111111111111111111111111111111111111111111111';

export async function withImportedAccount(
  options: {
    title?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<MockedEndpoint | MockedEndpoint[]>;
    privateKey?: string;
  },
  test: (driver: Driver) => Promise<void>,
) {
  await withMultichainAccountsDesignEnabled(options, async (driver) => {
    const accountListPage = new AccountListPage(driver);
    await accountListPage.addNewImportedAccount(
      options.privateKey ?? DUMMY_PRIVATE_KEY,
      undefined,
      {
        isMultichainAccountsState2Enabled: true,
      },
    );
    await test(driver);
  });
}

export {
  mockMultichainAccountsFeatureFlagDisabled,
  mockMultichainAccountsFeatureFlag,
  mockMultichainAccountsFeatureFlagStateTwo,
};
