import { CaipAssetType } from '@metamask/utils';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { buildReceivedAsset } from '../../../../../../test/data/batch-sell';
import {
  buildQuoteRequestContext,
  computeUsdAmountSource,
} from './buildQuoteRequestContext';

// This local buildAsset uses address + numeric chainId as required by
// buildQuoteRequestContext internals and differs from the shared factory.
const buildAsset = (overrides: Record<string, unknown> = {}): BatchSellAsset =>
  ({
    assetId:
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    chainId: 1,
    balance: '1000',
    tokenFiatPrice: 1,
    ...overrides,
  }) as unknown as BatchSellAsset;

describe('computeUsdAmountSource', () => {
  it('returns 0 when balance is missing', () => {
    const asset = buildAsset({ balance: undefined });

    expect(computeUsdAmountSource({ asset, sendAmountPercent: 100 })).toBe(0);
  });

  it('returns 0 when tokenFiatPrice is missing', () => {
    const asset = buildAsset({ tokenFiatPrice: undefined });

    expect(computeUsdAmountSource({ asset, sendAmountPercent: 100 })).toBe(0);
  });

  it('returns the full USD value when sendAmountPercent is 100', () => {
    const asset = buildAsset({ balance: '500', tokenFiatPrice: 2 });

    expect(computeUsdAmountSource({ asset, sendAmountPercent: 100 })).toBe(
      1000,
    );
  });

  it('returns half the USD value when sendAmountPercent is 50', () => {
    const asset = buildAsset({ balance: '500', tokenFiatPrice: 2 });

    expect(computeUsdAmountSource({ asset, sendAmountPercent: 50 })).toBe(500);
  });

  it('returns 0 when sendAmountPercent is 0', () => {
    const asset = buildAsset({ balance: '500', tokenFiatPrice: 2 });

    expect(computeUsdAmountSource({ asset, sendAmountPercent: 0 })).toBe(0);
  });

  it('handles fractional balance and price correctly', () => {
    const asset = buildAsset({ balance: '1.5', tokenFiatPrice: 3 });

    expect(computeUsdAmountSource({ asset, sendAmountPercent: 100 })).toBe(4.5);
  });

  it('does not throw when sendAmountPercent has more than 15 significant digits', () => {
    const asset = buildAsset({ balance: '500', tokenFiatPrice: 2 });

    expect(() =>
      computeUsdAmountSource({
        asset,
        sendAmountPercent: 33.333333333333336,
      }),
    ).not.toThrow();
  });
});

describe('buildQuoteRequestContext', () => {
  it('sets stx_enabled from smartTransactionsEnabled', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: buildAsset(),
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 100,
      smartTransactionsEnabled: true,
    });

    expect(result.stx_enabled).toBe(true);
  });

  it('sets stx_enabled to false when smartTransactionsEnabled is false', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: buildAsset(),
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.stx_enabled).toBe(false);
  });

  it('sets usd_amount_source from computeUsdAmountSource when sourceAsset is defined', () => {
    const asset = buildAsset({ balance: '200', tokenFiatPrice: 3 });

    const result = buildQuoteRequestContext({
      sourceAsset: asset,
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 50,
      smartTransactionsEnabled: false,
    });

    expect(result.usd_amount_source).toBe(300);
  });

  it('sets usd_amount_source to 0 when sourceAsset is undefined', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: undefined,
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.usd_amount_source).toBe(0);
  });

  it('always sets security_warnings to an empty array', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: buildAsset(),
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.security_warnings).toStrictEqual([]);
  });

  it('sets token_symbol_source from sourceAsset symbol', () => {
    const asset = buildAsset({ symbol: 'DAI' });

    const result = buildQuoteRequestContext({
      sourceAsset: asset,
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.token_symbol_source).toBe('DAI');
  });

  it('sets token_symbol_source to empty string when sourceAsset is undefined', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: undefined,
      receivedAsset: buildReceivedAsset(),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.token_symbol_source).toBe('');
  });

  it('sets token_symbol_destination from receivedAsset symbol', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: buildAsset(),
      receivedAsset: buildReceivedAsset({ symbol: 'WBTC' }),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.token_symbol_destination).toBe('WBTC');
  });

  it('sets token_security_type_destination from securityData type', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: buildAsset(),
      receivedAsset: buildReceivedAsset({
        securityData: {
          type: 'VERIFIED',
        } as unknown as BatchSellAsset['securityData'],
      }),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.token_security_type_destination).toBe('VERIFIED');
  });

  it('sets token_security_type_destination to null when securityData is absent', () => {
    const result = buildQuoteRequestContext({
      sourceAsset: buildAsset(),
      receivedAsset: buildReceivedAsset({ securityData: undefined }),
      sendAmountPercent: 100,
      smartTransactionsEnabled: false,
    });

    expect(result.token_security_type_destination).toBeNull();
  });
});
