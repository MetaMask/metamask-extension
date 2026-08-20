import { CaipChainId } from '@metamask/utils';
import {
  BATCH_SELL_ASSET_IDS,
  BATCH_SELL_CHAIN_ID,
  buildBatchSellAsset,
  buildSendAssetEntry,
} from '../../../../../../test/data/batch-sell';
import {
  buildSrcTokenAmountSmallestUnit,
  buildQuoteRequestForEntry,
} from './buildQuoteRequest';

const CHAIN_ID = BATCH_SELL_CHAIN_ID as unknown as CaipChainId;
const ASSET_ID = BATCH_SELL_ASSET_IDS.USDC;
const DEST_ASSET_ID = BATCH_SELL_ASSET_IDS.ETH_NATIVE;
const WALLET_ADDRESS = '0xWalletAddress';

const buildAsset = buildBatchSellAsset;
const buildEntry = buildSendAssetEntry;

describe('buildSrcTokenAmountSmallestUnit', () => {
  it('returns undefined when balance is missing', () => {
    const asset = buildAsset({ balance: undefined });

    expect(buildSrcTokenAmountSmallestUnit(asset, 100)).toBeUndefined();
  });

  it('returns undefined when decimals is 0 (falsy)', () => {
    const asset = buildAsset({ decimals: 0 });

    expect(buildSrcTokenAmountSmallestUnit(asset, 100)).toBeUndefined();
  });

  it('converts the full balance to smallest unit when sendAmountPercent is 100', () => {
    // 100 USDC (6 decimals) → 100_000_000
    const asset = buildAsset({ balance: '100', decimals: 6 });

    expect(buildSrcTokenAmountSmallestUnit(asset, 100)).toBe('100000000');
  });

  it('converts 50% of the balance to smallest unit', () => {
    // 50% of 100 USDC (6 decimals) → 50_000_000
    const asset = buildAsset({ balance: '100', decimals: 6 });

    expect(buildSrcTokenAmountSmallestUnit(asset, 50)).toBe('50000000');
  });

  it('drops fractional smallest-unit amounts (integer part only)', () => {
    // 33% of 1 token with 1 decimal: 0.33 * 10^1 = 3.3 → "3"
    const asset = buildAsset({ balance: '1', decimals: 1 });

    expect(buildSrcTokenAmountSmallestUnit(asset, 33)).toBe('3');
  });

  it('handles 18-decimal ETH-like assets correctly', () => {
    // 1 ETH at 100% → 1e18
    const asset = buildAsset({ balance: '1', decimals: 18 });

    expect(buildSrcTokenAmountSmallestUnit(asset, 100)).toBe(
      '1000000000000000000',
    );
  });

  it('does not throw when sendAmountPercent has more than 15 significant digits', () => {
    const asset = buildAsset({ balance: '100', decimals: 6 });

    expect(() =>
      buildSrcTokenAmountSmallestUnit(asset, 33.333333333333336),
    ).not.toThrow();
  });
});

describe('buildQuoteRequestForEntry', () => {
  it('returns undefined when srcTokenAmount cannot be computed (missing balance)', () => {
    const entry = buildEntry({ asset: buildAsset({ balance: undefined }) });

    expect(
      buildQuoteRequestForEntry({
        entry,
        destAssetId: DEST_ASSET_ID,
        walletAddress: WALLET_ADDRESS,
      }),
    ).toBeUndefined();
  });

  it('returns undefined when the computed srcTokenAmount is zero', () => {
    // 0% of any balance → '0'
    const entry = buildEntry({ sendAmountPercent: 0 });

    expect(
      buildQuoteRequestForEntry({
        entry,
        destAssetId: DEST_ASSET_ID,
        walletAddress: WALLET_ADDRESS,
      }),
    ).toBeUndefined();
  });

  it('returns a QuoteRequestParams when all required data is present', () => {
    const entry = buildEntry({
      asset: buildAsset({ balance: '100', decimals: 6 }),
      sendAmountPercent: 100,
      slippagePercent: 1,
    });

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: DEST_ASSET_ID,
      walletAddress: WALLET_ADDRESS,
    });

    expect(result).not.toBeUndefined();
  });

  it('sets srcTokenAmount to the correct smallest-unit value', () => {
    const entry = buildEntry({
      asset: buildAsset({ balance: '50', decimals: 6 }),
      sendAmountPercent: 100,
    });

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: DEST_ASSET_ID,
      walletAddress: WALLET_ADDRESS,
    });

    expect(result?.srcTokenAmount).toBe('50000000');
  });

  it('sets srcChainId and destChainId to the asset chainId (same-chain)', () => {
    const entry = buildEntry();

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: DEST_ASSET_ID,
      walletAddress: WALLET_ADDRESS,
    });

    expect(result?.srcChainId).toBe(CHAIN_ID);
    expect(result?.destChainId).toBe(CHAIN_ID);
  });

  it('sets srcTokenAddress from the source asset ID', () => {
    const entry = buildEntry();

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: DEST_ASSET_ID,
      walletAddress: WALLET_ADDRESS,
    });

    // formatAddressToCaipReference extracts the address part
    expect(result?.srcTokenAddress).toBe(
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    );
  });

  it('sets destTokenAddress from the destAssetId', () => {
    const entry = buildEntry();

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: 'eip155:1/slip44:60',
      walletAddress: WALLET_ADDRESS,
    });

    // native slip44:60 → zero address via formatAddressToCaipReference
    expect(result?.destTokenAddress).toBe(
      '0x0000000000000000000000000000000000000000',
    );
  });

  it('sets slippage from the entry slippagePercent', () => {
    const entry = buildEntry({ slippagePercent: 2.5 });

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: DEST_ASSET_ID,
      walletAddress: WALLET_ADDRESS,
    });

    expect(result?.slippage).toBe(2.5);
  });

  it('sets walletAddress from the provided argument', () => {
    const entry = buildEntry();

    const result = buildQuoteRequestForEntry({
      entry,
      destAssetId: DEST_ASSET_ID,
      walletAddress: '0xCustomWallet',
    });

    expect(result?.walletAddress).toBe('0xCustomWallet');
  });
});
