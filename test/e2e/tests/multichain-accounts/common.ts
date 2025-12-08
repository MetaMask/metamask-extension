import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';
import { MockedEndpoint } from '../../mock-e2e';
import { mockPriceApi } from '../tokens/utils/mocks';

import { E2E_SRP } from '../../fixtures/default-fixture';
import { SECOND_TEST_E2E_SRP } from '../../flask/multi-srp/common-multi-srp';
import {
  mockMultichainAccountsFeatureFlagDisabled,
  mockMultichainAccountsFeatureFlag,
  mockMultichainAccountsFeatureFlagStateTwo,
} from './feature-flag-mocks';
import { MockedDiscoveryBuilder } from './discovery';

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
    dappOptions,
    shouldMockDiscovery = true,
    withFixtures: withMoreFixtures,
  }: {
    title?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<MockedEndpoint | MockedEndpoint[] | void>;
    accountType?: AccountType;
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
      fixtureBuilder = fixtureBuilder
        .withLedgerAccount()
        .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
        .withEnabledNetworks({ eip155: { '0x1': true } });
      srps = [E2E_SRP];
      break;
    default:
      fixtureBuilder = fixtureBuilder
        .withKeyringControllerMultiSRP()
        .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
        .withEnabledNetworks({ eip155: { '0x1': true } });
      srps = [E2E_SRP, SECOND_TEST_E2E_SRP];
      break;
  }

  if (withMoreFixtures) {
    fixtureBuilder = withMoreFixtures(fixtureBuilder);
  }

  const mockNetworkCalls = async (mockServer: Mockttp) => {
    await testSpecificMock?.(mockServer);

    if (shouldMockDiscovery) {
      for (const srp of srps) {
        await MockedDiscoveryBuilder.from(srp)
          .doNotDiscoverAnyAccounts()
          .mock(mockServer);
      }
    }

    await mockPriceApi(mockServer);
  };

  await withFixtures(
    {
      fixtures: fixtureBuilder.build(),
      testSpecificMock: mockNetworkCalls,
      title,
      dappOptions,
    },
    async ({ driver }: { driver: Driver; mockServer: Mockttp }) => {
      // Skip strict balance validation for hardware wallets
      if (accountType === AccountType.HardwareWallet) {
        await loginWithoutBalanceValidation(driver);
      } else {
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '$85,025.00',
        );
      }
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();

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
