import { Mockttp } from 'mockttp';
import { KeyringAccount } from '@metamask/keyring-api';
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

import { ACCOUNT_TYPE, INFURA_MAINNET_URL } from '../../constants';
import { SOLANA_URL_REGEX_MAINNET } from '../solana/common-solana';
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

type Bip44DiscoverNextAccount = {
  [type in ACCOUNT_TYPE]: KeyringAccount['address'];
};

// List of accounts that the account discovery will try to discover.
const BIP44_DISCOVER_NEXT_ACCOUNTS: Bip44DiscoverNextAccount[] = [
  // NOTE: Those accounts contain the next addresses (which followed the
  // existing accounts in the vault).
  {
    // Wallet 1 > Account 1 => next
    [ACCOUNT_TYPE.Ethereum]: '0x09781764c08de8ca82e156bbf156a3ca217c7950',
    [ACCOUNT_TYPE.Solana]: 'ExTE8W1KuMHod2EihdQPeD8mdC87Rg9UJh2FASmbGNtt',
    [ACCOUNT_TYPE.Bitcoin]: '',
  },
  {
    // Wallet 2 > Account 1 => next
    [ACCOUNT_TYPE.Ethereum]: '0x59a897a2dbd55d20bcc9b52d5eaa14e2859dc467',
    [ACCOUNT_TYPE.Solana]: '5R8a8GBd971kg5B5FqisVmVRk6ooFYtsh1y7vCHNvRvf',
    [ACCOUNT_TYPE.Bitcoin]: '',
  },
];

async function mockEvmDiscoveryOnce(mockServer: Mockttp, address: string) {
  return await mockServer
    .forPost(INFURA_MAINNET_URL)
    .once()
    .withJsonBodyIncluding({
      method: 'eth_getTransactionCount',
    })
    .withBodyIncluding(address)
    .once()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: '1111111111111111',
          result: '0x0',
        },
      };
    });
}

async function mockSolDiscoveryOnce(mockServer: Mockttp, address: string) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX_MAINNET)
    .withJsonBodyIncluding({
      method: 'getSignaturesForAddress',
    })
    .withBodyIncluding(address)
    .once()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: [],
        },
      };
    });
}

export async function mockDiscovery(mockServer: Mockttp) {
  for (const account of BIP44_DISCOVER_NEXT_ACCOUNTS) {
    await mockEvmDiscoveryOnce(mockServer, account[ACCOUNT_TYPE.Ethereum]);
    await mockSolDiscoveryOnce(mockServer, account[ACCOUNT_TYPE.Solana]);
    // TODO: Add Bitcoin discovery.
  }
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

  switch (accountType) {
    case AccountType.MultiSRP:
      fixtureBuilder = fixtureBuilder.withKeyringControllerMultiSRP();
      break;
    case AccountType.SSK:
      fixtureBuilder = fixtureBuilder.withKeyringControllerMultiSRP();
      break;
    case AccountType.HardwareWallet:
      fixtureBuilder = fixtureBuilder.withLedgerAccount();
      break;
    default:
      fixtureBuilder = fixtureBuilder.withKeyringControllerMultiSRP();
  }

  if (withMoreFixtures) {
    fixtureBuilder = withMoreFixtures(fixtureBuilder);
  }

  const mockNetworkCalls = async (mockServer: Mockttp) => {
    if (shouldMockDiscovery) {
      await mockDiscovery(mockServer);
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
