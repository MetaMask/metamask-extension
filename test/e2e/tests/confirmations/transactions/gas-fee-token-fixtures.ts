import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../../constants';
import { getMockAssetsPrice } from '../../tokens/utils/mocks';

export const GAS_FEE_USDC_ADDRESS =
  '0x1234567890abcdef1234567890abcdef12345678';
export const GAS_FEE_DAI_ADDRESS = '0x01234567890abcdef1234567890abcdef1234567';
export const GAS_FEE_USDC_ASSET_ID = `eip155:1/erc20:${GAS_FEE_USDC_ADDRESS}`;
export const GAS_FEE_DAI_ASSET_ID = `eip155:1/erc20:${GAS_FEE_DAI_ADDRESS}`;

export const GAS_FEE_ETH_CONVERSION_RATE_USD = 1700;

export const GAS_FEE_SPOT_PRICES = {
  'eip155:1/slip44:60': {
    price: GAS_FEE_ETH_CONVERSION_RATE_USD,
    marketCap: 382623505141,
    pricePercentChange1d: 0,
  },
  [GAS_FEE_DAI_ASSET_ID]: { price: 1, marketCap: 0, pricePercentChange1d: 0 },
  [GAS_FEE_USDC_ASSET_ID]: { price: 1, marketCap: 0, pricePercentChange1d: 0 },
};

export const GAS_FEE_TOKEN_ASSETS_INFO = {
  [GAS_FEE_DAI_ASSET_ID]: {
    aggregators: [],
    decimals: 3,
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    type: 'erc20' as const,
  },
  [GAS_FEE_USDC_ASSET_ID]: {
    aggregators: [],
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    type: 'erc20' as const,
  },
};

const GAS_FEE_ERC20_ASSETS_PRICE = {
  [GAS_FEE_DAI_ASSET_ID]: {
    assetPriceType: 'fungible' as const,
    id: 'dai',
    lastUpdated: 0,
    price: 1,
    usdPrice: 1,
  },
  [GAS_FEE_USDC_ASSET_ID]: {
    assetPriceType: 'fungible' as const,
    id: 'usd-coin',
    lastUpdated: 0,
    price: 1,
    usdPrice: 1,
  },
};

export const GAS_FEE_UNIFIED_MAINNET_ADDITIONAL_BALANCES = [
  { assetId: GAS_FEE_DAI_ASSET_ID, balance: '10' },
  { assetId: GAS_FEE_USDC_ASSET_ID, balance: '5' },
];

/**
 * Seeds DAI/USDC balances for gas-fee token modal assertions under unified assets.
 *
 * @param nativeEthAmount - Mainnet native ETH balance (human-readable).
 */
export function getGasFeeTokenAssetsControllerPatch(nativeEthAmount = '0') {
  return {
    assetsBalance: {
      [DEFAULT_FIXTURE_ACCOUNT_ID]: {
        'eip155:1/slip44:60': { amount: nativeEthAmount },
        [GAS_FEE_DAI_ASSET_ID]: { amount: '10' },
        [GAS_FEE_USDC_ASSET_ID]: { amount: '5' },
      },
    },
    assetsInfo: GAS_FEE_TOKEN_ASSETS_INFO,
    assetsPrice: {
      ...getMockAssetsPrice(GAS_FEE_ETH_CONVERSION_RATE_USD),
      ...GAS_FEE_ERC20_ASSETS_PRICE,
    },
  };
}
