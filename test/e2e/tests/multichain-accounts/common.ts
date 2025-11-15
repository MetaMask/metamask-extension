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
import NetworkManager from '../../page-objects/pages/network-manager';
import { mockEtherumSpotPrices } from '../tokens/utils/mocks';

import {
  mockMultichainAccountsFeatureFlagDisabled,
  mockMultichainAccountsFeatureFlag,
  mockMultichainAccountsFeatureFlagStateTwo,
} from './feature-flag-mocks';

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
  }: {
    title?: string;
    testSpecificMock?: (
      mockServer: Mockttp,
    ) => Promise<MockedEndpoint | MockedEndpoint[]>;
    accountType?: AccountType;
    dappOptions?: { numberOfTestDapps?: number; customDappPaths?: string[] };
  },
  test: (driver: Driver) => Promise<void>,
) {
  let fixture;

  switch (accountType) {
    case AccountType.HardwareWallet:
      fixture = new FixtureBuilder()
        .withLedgerAccount()
        .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
        .withEnabledNetworks({ eip155: { '0x1': true } })
        .build();
      break;
    default:
      fixture = new FixtureBuilder()
        .withKeyringControllerMultiSRP()
        .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
        .withEnabledNetworks({ eip155: { '0x1': true } })
        .build();
      break;
  }

  await withFixtures(
    {
      fixtures: fixture,
      testSpecificMock: async (mockServer: Mockttp) => {
        const additionalMocks = testSpecificMock
          ? await testSpecificMock(mockServer)
          : [];
        return [await mockEtherumSpotPrices(mockServer), [additionalMocks]];
      },
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
          '$42,500.00',
        );
      }
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      const networkManager = new NetworkManager(driver);
      await networkManager.openNetworkManager();
      await networkManager.selectNetworkByNameWithWait('Ethereum');
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
