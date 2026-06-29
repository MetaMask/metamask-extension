import { Suite } from 'mocha';
import { Hex } from '@metamask/utils';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import ConfirmAlertModal from '../../page-objects/pages/dialog/confirm-alert';
import { WALLET_ADDRESS } from '../confirmations/signatures/signature-helpers';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';

/** Default Anvil account balance (25 ETH) in wei. */
const ANVIL_DEFAULT_BALANCE = '0x15af1d78b58c40000';

const DEFAULT_NATIVE_BALANCE_HUMAN = '25';

// Network configuration type
type NetworkConfig = {
  name: string;
  tokenSymbol: string;
  tokenName: string;
  chainCaipId: string;
  chainIdDecimal: number;
  fixtureMethod: (builder: FixtureBuilderV2) => FixtureBuilderV2;
  testTitle: string;
  chainId: Hex;
};

function getNativeSlip44(chainIdDecimal: number): string {
  if (chainIdDecimal === 1337 || chainIdDecimal === 6343) {
    return '1';
  }
  return '60';
}

function getNativeAssetId(config: NetworkConfig): string {
  return `${config.chainCaipId}/slip44:${getNativeSlip44(config.chainIdDecimal)}`;
}

function buildNetworkConnectionFixtures(config: NetworkConfig) {
  const nativeAssetId = getNativeAssetId(config);

  return config
    .fixtureMethod(new FixtureBuilderV2())
    .withPermissionControllerConnectedToTestDapp({
      chainIds: [parseInt(config.chainId, 16)],
    })
    .withEnabledNetworks({
      eip155: {
        [config.chainId]: true,
      },
    })
    .withAccountTracker({
      accountsByChainId: {
        [config.chainId]: {
          [DEFAULT_FIXTURE_ACCOUNT]: {
            balance: ANVIL_DEFAULT_BALANCE,
            stakedBalance: '0x0',
          },
        },
      },
    })
    .withAssetsController({
      assetsBalance: {
        [DEFAULT_FIXTURE_ACCOUNT_ID]: {
          [nativeAssetId]: { amount: DEFAULT_NATIVE_BALANCE_HUMAN },
        },
      },
      assetsInfo: {
        [nativeAssetId]: {
          aggregators: [],
          decimals: 18,
          image: '',
          name: config.tokenName,
          symbol: config.tokenSymbol,
          type: 'native',
        },
      },
    })
    .build();
}

/**
 * Priority 99 overrides global mock-e2e handlers registered after testSpecificMock.
 * @param mockServer
 * @param config
 */
function mockNetworkConnectionApis(mockServer: Mockttp, config: NetworkConfig) {
  const nativeAssetId = getNativeAssetId(config);
  const slip44 = getNativeSlip44(config.chainIdDecimal);
  const v3AssetEntry = {
    assetId: nativeAssetId,
    name: config.tokenName,
    symbol: config.tokenSymbol,
    decimals: 18,
    type: 'native',
  };

  return [
    mockServer
      .forGet(
        /https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u,
      )
      .asPriority(99)
      .always()
      .thenJson(200, {
        fullSupport: [1, 1337, config.chainIdDecimal],
        partialSupport: { balances: [] },
      }),
    mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
      .asPriority(99)
      .always()
      .thenJson(200, {
        fullSupport: ['eip155:1', config.chainCaipId],
        partialSupport: [],
      }),
    mockServer
      .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
      .asPriority(99)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [v3AssetEntry],
      })),
    mockServer
      .forGet(
        /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
      )
      .asPriority(99)
      .always()
      .thenCallback((req) => {
        const accountIds =
          new URL(req.url).searchParams
            .get('accountIds')
            ?.split(',')
            .filter(Boolean) ?? [];

        const balances = accountIds
          .filter((accountId) =>
            accountId.toLowerCase().includes(DEFAULT_FIXTURE_ACCOUNT_LOWERCASE),
          )
          .map((accountId) => {
            const chainRef =
              accountId.split(':')[1] ?? String(config.chainIdDecimal);
            return {
              accountId,
              assetId: `eip155:${chainRef}/slip44:${slip44}`,
              balance: DEFAULT_NATIVE_BALANCE_HUMAN,
            };
          });

        return {
          statusCode: 200,
          json: {
            count: balances.length,
            balances,
            unprocessedNetworks: [],
          },
        };
      }),
  ];
}

// Network configurations
const networkConfigs: NetworkConfig[] = [
  {
    name: 'Monad Testnet',
    tokenSymbol: 'MON',
    tokenName: 'Monad',
    chainCaipId: 'eip155:10143',
    chainIdDecimal: 10143,
    fixtureMethod: (builder) =>
      builder.withSelectedNetwork(NETWORK_CLIENT_ID.MONAD_TESTNET),
    testTitle: 'Monad Network Connection Tests',
    chainId: CHAIN_IDS.MONAD_TESTNET,
  },
  {
    name: 'MegaETH Testnet',
    tokenSymbol: 'MegaETH',
    tokenName: 'MegaETH',
    chainCaipId: 'eip155:6343',
    chainIdDecimal: 6343,
    fixtureMethod: (builder) =>
      builder.withSelectedNetwork(NETWORK_CLIENT_ID.MEGAETH_TESTNET_V2),
    testTitle: 'MegaETH Network Connection Tests',
    chainId: CHAIN_IDS.MEGAETH_TESTNET_V2,
  },
  {
    name: 'Sei',
    tokenSymbol: 'SEI',
    tokenName: 'Sei',
    chainCaipId: 'eip155:1329',
    chainIdDecimal: 1329,
    fixtureMethod: (builder) => builder.withNetworkControllerOnSei(),
    testTitle: 'Sei Network Connection Tests',
    chainId: CHAIN_IDS.SEI,
  },
];

// Helper function to perform Dapp action and verify
const performDappActionAndVerify = async (
  driver: Driver,
  action: () => Promise<void>,
  networkName: string,
) => {
  await action();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(500);
  const confirmAlertModal = new ConfirmAlertModal(driver);
  await confirmAlertModal.verifyNetworkDisplay(networkName);
};

// Generate test cases for each network
networkConfigs.forEach((config) => {
  describe(config.testTitle, function (this: Suite) {
    it(`should connect dapp to ${config.name} and verify ${config.tokenSymbol} network and tokens`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: buildNetworkConnectionFixtures(config),
          title: this.test?.fullTitle(),
          testSpecificMock: (mockServer) =>
            mockNetworkConnectionApis(mockServer, config),
        },
        async ({ driver }: { driver: Driver }) => {
          // TODO: Investigate why the balance intermittently fails to load on Monad
          // Testnet in CI and re-enable balance validation once the root cause is found.
          await login(driver, { validateBalance: false });

          const tokensTab = new TokensTab(driver);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Verify token is displayed
          await tokensTab.checkTokenExistsInList(config.tokenSymbol);

          // Open the test dapp and verify balance
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          // Verify dapp can access the account
          await testDapp.checkGetAccountsResult(WALLET_ADDRESS.toLowerCase());

          // Test various Dapp functionalities
          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSimpleSendButton(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickCreateToken(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickERC721DeployButton(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickPersonalSign(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedData(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedDatav3(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedDatav4(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickPermit(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickERC1155DeployButton(),
            config.name,
          );
        },
      );
    });
  });
});
