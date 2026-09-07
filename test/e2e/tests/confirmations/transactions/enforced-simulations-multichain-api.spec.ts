import { MockttpServer } from 'mockttp';
import { Suite } from 'mocha';
import { ResultType } from '../../../../../shared/lib/trust-signals';
import { DAPP_PATH } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { MockedEndpoint } from '../../../mock-e2e';
import { login } from '../../../page-objects/flows/login.flow';
import { invokeCaipTransaction } from '../../../page-objects/flows/multichain-dapp.flow';
import { mockEip7702FeatureFlag } from '../helpers';
import { mockSimulationApi } from '../mocks/simulation';
import { mockTrustSignal } from '../mocks/trust-signals';
import { SENDER_ADDRESS_MOCK } from '../../simulation-details/types';
import { getMockAssetsPrice, mockSpotPrices } from '../../tokens/utils/mocks';

const EVM_SCOPE = 'eip155:1';

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDC_ASSET_ID = `eip155:1/erc20:${USDC_ADDRESS}`;
const ETH_USD_CONVERSION_RATE = 3010;
const SPOT_PRICES = {
  'eip155:1/slip44:60': {
    price: ETH_USD_CONVERSION_RATE,
    marketCap: 382623505141,
    pricePercentChange1d: 0,
  },
  [USDC_ASSET_ID]: {
    price: 1,
    marketCap: 0,
    pricePercentChange1d: 0,
  },
};

const RECIPIENT_ADDRESS = '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc';
const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
const USDC_TRANSFER_AMOUNT_HEX = '0f4240';
const USDC_SENDER_PRE_BALANCE_HEX = '3b9aca00';
const USDC_SENDER_POST_BALANCE_HEX = '3b8b87c0';

const USDC_TRANSFER_CALLDATA = `${ERC20_TRANSFER_SELECTOR}${'0'.repeat(24)}${RECIPIENT_ADDRESS.slice(2)}${USDC_TRANSFER_AMOUNT_HEX.padStart(64, '0')}`;

const TRANSACTION_MOCK = {
  data: USDC_TRANSFER_CALLDATA,
  from: SENDER_ADDRESS_MOCK,
  gas: '0x7A120',
  maxFeePerGas: '0x2540BE400',
  maxPriorityFeePerGas: '0x3B9ACA00',
  to: USDC_ADDRESS,
  value: '0x0',
};

const ENFORCED_SIMULATIONS_LOAD_STATE =
  './test/e2e/seeder/network-states/eip7702-state/withEnforcedSimulationContracts.json';

/**
 * Transactions submitted through the Multichain API (`wallet_invokeMethod`)
 * reach the transaction pipeline via a different JSON-RPC engine than EIP-1193
 * `eth_sendTransaction`. These tests assert that the trust signal for the
 * transaction recipient is resolved on that path too, so enforced simulations
 * are applied consistently across both engines.
 */
describe('Enforced Simulations - Multichain API', function (this: Suite) {
  it('enforces simulations when the recipient is malicious', async function () {
    const title = this.test?.fullTitle();

    await withFixtures(
      fixtureOptions(title, setupMocks(ResultType.Malicious)),
      async ({ driver, extensionId }) => {
        await login(driver, { expectedBalance: '10' });

        const confirmation = await invokeCaipTransaction(driver, extensionId, {
          scope: EVM_SCOPE,
          method: 'eth_sendTransaction',
          params: [TRANSACTION_MOCK],
        });

        await confirmation.checkEnforcedSimulationsRowIsDisplayed();
      },
    );
  });

  it('does not enforce simulations when the recipient is trusted', async function () {
    const title = this.test?.fullTitle();

    await withFixtures(
      fixtureOptions(title, setupMocks(ResultType.Trusted)),
      async ({ driver, extensionId }) => {
        await login(driver, { expectedBalance: '10' });

        const confirmation = await invokeCaipTransaction(driver, extensionId, {
          scope: EVM_SCOPE,
          method: 'eth_sendTransaction',
          params: [TRANSACTION_MOCK],
        });

        await confirmation.checkEstimatedSimulationDetails('- <0.000001');
        await confirmation.checkEnforcedSimulationsRowIsNotDisplayed();
      },
    );
  });
});

function setupMocks(trustResultType: ResultType) {
  return async (mockServer: MockttpServer): Promise<MockedEndpoint[]> => {
    const eip7702Mocks = await mockEip7702FeatureFlag(mockServer);
    const trustMocks = await mockTrustSignal(mockServer, trustResultType);
    await mockSpotPrices(mockServer, SPOT_PRICES);
    await mockSimulationApi(mockServer, {
      sender: SENDER_ADDRESS_MOCK,
      recipient: RECIPIENT_ADDRESS,
      token: USDC_ADDRESS,
      amountHex: USDC_TRANSFER_AMOUNT_HEX,
      preBalanceHex: USDC_SENDER_PRE_BALANCE_HEX,
      postBalanceHex: USDC_SENDER_POST_BALANCE_HEX,
    });
    return [...eip7702Mocks, ...trustMocks];
  };
}

function fixtureOptions(
  title: string | undefined,
  testSpecificMock: (server: MockttpServer) => Promise<MockedEndpoint[]>,
) {
  return {
    dappOptions: { customDappPaths: [DAPP_PATH.TEST_DAPP_MULTICHAIN] },
    fixtures: new FixtureBuilderV2()
      .withEnabledNetworks({ eip155: { '0x1': true } })
      .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
      .withSmartTransactionsOptedOut()
      .withAssetsController({
        assetsPrice: getMockAssetsPrice(ETH_USD_CONVERSION_RATE),
      })
      .build(),
    localNodeOptions: {
      chainId: 1,
      hardfork: 'Prague',
      loadState: ENFORCED_SIMULATIONS_LOAD_STATE,
    },
    testSpecificMock,
    title,
  };
}
