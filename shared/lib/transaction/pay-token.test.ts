import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import type { CaipAssetType, Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../constants/network';
import { POLYGON_NATIVE_TOKEN_ADDRESS } from '../../constants/transaction';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
} from '../../../test/data/mock-accounts';
import {
  decodeEvmAssetId,
  decodePaymentTokenAssetId,
  encodeEvmAssetId,
  getEvmAccountOverride,
  getPaymentTokenChainId,
  isSameAssetId,
} from './pay-token';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const BTC_ASSET_ID =
  'bip122:000000000019d6689c085ae165831e93/slip44:0' as CaipAssetType;
const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOL_ASSET_ID = `${SOLANA_MAINNET}/slip44:501` as CaipAssetType;

function createPaymentToken(assetId: CaipAssetType): TransactionPaymentToken {
  return {
    assetId,
    balanceFiat: '1',
    balanceHuman: '1',
    balanceRaw: '1',
    balanceUsd: '1',
    decimals: 6,
    symbol: 'TST',
  };
}

describe('pay-token', () => {
  describe('decodeEvmAssetId', () => {
    it('derives the chain and address of an ERC-20 asset', () => {
      expect(decodeEvmAssetId(`eip155:1/erc20:${USDC_ADDRESS}`)).toStrictEqual({
        address: USDC_ADDRESS,
        chainId: '0x1',
      });
    });

    it('maps a slip44 native asset to the chain native token address', () => {
      expect(decodeEvmAssetId('eip155:8453/slip44:60')).toStrictEqual({
        address: ZERO_ADDRESS,
        chainId: '0x2105',
      });
      expect(decodeEvmAssetId('eip155:137/slip44:966')).toStrictEqual({
        address: POLYGON_NATIVE_TOKEN_ADDRESS,
        chainId: '0x89',
      });
    });

    it('returns undefined for a non-EVM asset', () => {
      expect(decodeEvmAssetId(BTC_ASSET_ID)).toBeUndefined();
    });
  });

  describe('encodeEvmAssetId', () => {
    it('builds a checksummed ERC-20 asset ID', () => {
      expect(
        encodeEvmAssetId({
          address: USDC_ADDRESS.toLowerCase() as Hex,
          chainId: '0x1',
        }),
      ).toBe(`eip155:1/erc20:${USDC_ADDRESS}`);
    });

    it('builds the slip44 native asset ID for the native token address', () => {
      expect(
        encodeEvmAssetId({ address: ZERO_ADDRESS, chainId: CHAIN_IDS.MAINNET }),
      ).toBe('eip155:1/slip44:60');
      expect(
        encodeEvmAssetId({
          address: POLYGON_NATIVE_TOKEN_ADDRESS,
          chainId: CHAIN_IDS.POLYGON,
        }),
      ).toBe('eip155:137/slip44:966');
    });

    it('builds the registered native asset ID on BSC and Monad', () => {
      expect(
        encodeEvmAssetId({ address: ZERO_ADDRESS, chainId: CHAIN_IDS.BSC }),
      ).toBe('eip155:56/slip44:714');
      expect(
        encodeEvmAssetId({ address: ZERO_ADDRESS, chainId: CHAIN_IDS.MONAD }),
      ).toBe('eip155:143/slip44:268435779');
    });

    it('falls back to the zero-address ERC-20 asset ID for the native token of an unregistered chain', () => {
      expect(encodeEvmAssetId({ address: ZERO_ADDRESS, chainId: '0x64' })).toBe(
        `eip155:100/erc20:${ZERO_ADDRESS}`,
      );
    });

    it('treats the zero address as native POL on Polygon', () => {
      expect(
        encodeEvmAssetId({ address: ZERO_ADDRESS, chainId: CHAIN_IDS.POLYGON }),
      ).toBe('eip155:137/slip44:966');
    });
  });

  describe('decodePaymentTokenAssetId', () => {
    it('derives the chain and address of an EVM payment token', () => {
      expect(
        decodePaymentTokenAssetId(
          createPaymentToken(`eip155:1/erc20:${USDC_ADDRESS}`),
        ),
      ).toStrictEqual({
        address: USDC_ADDRESS,
        chainId: '0x1',
      });
    });

    it('returns undefined for a non-EVM or missing payment token', () => {
      expect(
        decodePaymentTokenAssetId(createPaymentToken(BTC_ASSET_ID)),
      ).toBeUndefined();
      expect(decodePaymentTokenAssetId(undefined)).toBeUndefined();
    });
  });

  describe('isSameAssetId', () => {
    it('matches asset IDs case-insensitively', () => {
      expect(
        isSameAssetId(
          `eip155:1/erc20:${USDC_ADDRESS}`,
          `eip155:1/erc20:${USDC_ADDRESS.toLowerCase()}`,
        ),
      ).toBe(true);
    });

    it('does not match different or missing asset IDs', () => {
      expect(
        isSameAssetId(`eip155:1/erc20:${USDC_ADDRESS}`, BTC_ASSET_ID),
      ).toBe(false);
      expect(isSameAssetId(BTC_ASSET_ID, undefined)).toBe(false);
      expect(isSameAssetId(undefined, undefined)).toBe(false);
    });
  });

  describe('getPaymentTokenChainId', () => {
    it('returns the Hex chain ID for EVM and the CAIP-2 chain ID for non-EVM tokens', () => {
      expect(
        getPaymentTokenChainId(createPaymentToken('eip155:42161/slip44:60')),
      ).toBe('0xa4b1');
      expect(getPaymentTokenChainId(createPaymentToken(SOL_ASSET_ID))).toBe(
        SOLANA_MAINNET,
      );
    });
  });

  describe('getEvmAccountOverride', () => {
    const accounts = {
      [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
      [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
    };

    it('returns the address of an EVM override account', () => {
      expect(getEvmAccountOverride(MOCK_ACCOUNT_EOA.id, accounts)).toBe(
        MOCK_ACCOUNT_EOA.address,
      );
    });

    it('returns undefined for a non-EVM override account', () => {
      expect(
        getEvmAccountOverride(MOCK_ACCOUNT_BIP122_P2WPKH.id, accounts),
      ).toBeUndefined();
    });

    it('returns undefined for an unknown or missing override', () => {
      expect(getEvmAccountOverride('unknown-id', accounts)).toBeUndefined();
      expect(getEvmAccountOverride(undefined, accounts)).toBeUndefined();
    });
  });
});
