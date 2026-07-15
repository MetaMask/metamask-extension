import { merge } from 'lodash';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  TRON_CHAIN_ID,
  TRX_BALANCE,
  TRX_TO_USD_RATE,
} from './mocks/common-tron';

/** Deterministic Tron snap account id for the default E2E SRP (BIP44 /195). */
export const TRON_ACCOUNT_ID = 'c8f3a2e1-4d5b-6c7a-8e9f-0a1b2c3d4e5f';

const TRON_NATIVE_CAIP_ASSET_ID = `${TRON_CHAIN_ID}/slip44:195`;
const TRON_HTX_CAIP_ASSET_ID =
  'tron:728126428/trc20:TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6';
const TRON_USDT_CAIP_ASSET_ID =
  'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRON_USDD_CAIP_ASSET_ID =
  'tron:728126428/trc20:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz';

const TRON_ASSETS_INFO = {
  [TRON_NATIVE_CAIP_ASSET_ID]: {
    decimals: 6,
    image:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/slip44/195.png',
    name: 'Tron',
    symbol: 'TRX',
    type: 'native',
  },
  [TRON_HTX_CAIP_ASSET_ID]: {
    decimals: 18,
    name: 'HTX',
    symbol: 'HTX',
    type: 'erc20',
  },
  [TRON_USDT_CAIP_ASSET_ID]: {
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    type: 'erc20',
  },
  [TRON_USDD_CAIP_ASSET_ID]: {
    decimals: 18,
    name: 'Decentralized USD',
    symbol: 'USDD',
    type: 'erc20',
  },
};

const TRON_TRX_BALANCE_HUMAN = String(TRX_BALANCE / 1_000_000);

const TRON_NON_ZERO_ASSETS_BALANCE = {
  [TRON_NATIVE_CAIP_ASSET_ID]: {
    amount: TRON_TRX_BALANCE_HUMAN,
  },
  [TRON_HTX_CAIP_ASSET_ID]: {
    amount: '3156454.956836360132407885',
  },
  [TRON_USDT_CAIP_ASSET_ID]: {
    amount: '2.804595',
  },
  [TRON_USDD_CAIP_ASSET_ID]: {
    amount: '0.289757448699320931',
  },
};

const TRON_ZERO_ASSETS_BALANCE = {
  [TRON_NATIVE_CAIP_ASSET_ID]: {
    amount: '0',
  },
};

const TRON_MULTICHAIN_ASSETS_PATCH = {
  MultichainAssetsController: {
    accountsAssets: {
      [TRON_ACCOUNT_ID]: Object.keys(TRON_NON_ZERO_ASSETS_BALANCE),
    },
  },
  MultichainRatesController: {
    conversionRates: {
      [TRON_NATIVE_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: String(TRX_TO_USD_RATE),
      },
      [TRON_HTX_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: '0.00000168',
      },
      [TRON_USDT_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: '0.999176',
      },
      [TRON_USDD_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: '0.999959',
      },
    },
  },
};

const TRON_ASSETS_CONTROLLER_FIXTURE = {
  assetsInfo: TRON_ASSETS_INFO,
  assetsPrice: {
    [TRON_NATIVE_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'tron',
      lastUpdated: 0,
      price: TRX_TO_USD_RATE,
      usdPrice: TRX_TO_USD_RATE,
    },
    [TRON_HTX_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'htx-dao',
      lastUpdated: 0,
      price: 0.00000168,
      usdPrice: 0.00000168,
    },
    [TRON_USDT_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'tether',
      lastUpdated: 0,
      price: 0.999176,
      usdPrice: 0.999176,
    },
    [TRON_USDD_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'usdd',
      lastUpdated: 0,
      price: 0.999959,
      usdPrice: 0.999959,
    },
  },
};

type BuildTronFixturesOptions = {
  showNativeTokenAsMainBalanceDisabled?: boolean;
  zeroBalance?: boolean;
};

function buildTronAssetsControllerFixture(zeroBalance = false) {
  return {
    ...TRON_ASSETS_CONTROLLER_FIXTURE,
    assetsBalance: {
      [TRON_ACCOUNT_ID]: zeroBalance
        ? TRON_ZERO_ASSETS_BALANCE
        : TRON_NON_ZERO_ASSETS_BALANCE,
    },
  };
}

/**
 * Unified-assets fixture for Tron snap flows. Keeps the default EVM account
 * selected so `login()` still validates localhost 25 ETH before switching networks.
 *
 * @param configure
 * @param options
 * @param options.showNativeTokenAsMainBalanceDisabled
 * @param options.zeroBalance
 */
export function buildTronFixtures(
  configure?: (builder: FixtureBuilderV2) => FixtureBuilderV2,
  {
    showNativeTokenAsMainBalanceDisabled = false,
    zeroBalance = false,
  }: BuildTronFixturesOptions = {},
) {
  let builder = new FixtureBuilderV2()
    .withAssetsController(buildTronAssetsControllerFixture(zeroBalance));

  if (showNativeTokenAsMainBalanceDisabled) {
    builder = builder.withShowNativeTokenAsMainBalanceDisabled();
  }

  if (configure) {
    builder = configure(builder);
  }

  const fixture = builder.build();
  const multichainPatch = zeroBalance
    ? {
        MultichainAssetsController: {
          accountsAssets: {
            [TRON_ACCOUNT_ID]: [TRON_NATIVE_CAIP_ASSET_ID],
          },
        },
        MultichainRatesController: {
          conversionRates: {
            [TRON_NATIVE_CAIP_ASSET_ID]: {
              conversionTime: 0,
              rate: String(TRX_TO_USD_RATE),
            },
          },
        },
      }
    : TRON_MULTICHAIN_ASSETS_PATCH;
  merge(fixture.data, multichainPatch);
  return fixture;
}
