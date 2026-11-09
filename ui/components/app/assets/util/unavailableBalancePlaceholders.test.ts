import { type TokenWithFiatAmount } from '../types';
import {
  buildUnavailableBalancePlaceholderTokens,
  isUnavailableBalancePlaceholder,
} from './unavailableBalancePlaceholders';

const BTC = 'bip122:000000000019d6689c085ae165831e93';
const XLM = 'stellar:pubnet';
const TRX = 'tron:728126428';

const nativeRow = (chainId: string, symbol: string) =>
  ({
    chainId,
    symbol,
    isNative: true,
    address: `${chainId}/slip44:0`,
    title: symbol,
    image: '',
    decimals: 8,
    secondary: null,
  }) as unknown as TokenWithFiatAmount;

describe('buildUnavailableBalancePlaceholderTokens', () => {
  it('returns no rows when nothing is unavailable', () => {
    expect(
      buildUnavailableBalancePlaceholderTokens({
        unavailableChainIds: [],
        tokens: [],
        isChainShown: () => true,
      }),
    ).toStrictEqual([]);
  });

  it('builds a native placeholder row per unavailable chain without a native row', () => {
    const rows = buildUnavailableBalancePlaceholderTokens({
      unavailableChainIds: [BTC, XLM, TRX, BTC],
      tokens: [nativeRow(TRX, 'TRX')],
      isChainShown: () => true,
    });

    expect(rows.map(({ symbol }) => symbol)).toStrictEqual(['BTC', 'XLM']);
    expect(rows[0]).toMatchObject({
      chainId: BTC,
      address: `${BTC}/slip44:0`,
      assetId: `${BTC}/slip44:0`,
      caipAssetId: `${BTC}/slip44:0`,
      title: 'Bitcoin',
      decimals: 8,
      isNative: true,
      balance: undefined,
      tokenFiatAmount: null,
    });
    expect(rows[1]).toMatchObject({
      chainId: XLM,
      address: `${XLM}/slip44:148`,
      title: 'Stellar',
    });
    expect(rows.every(isUnavailableBalancePlaceholder)).toBe(true);
    expect(isUnavailableBalancePlaceholder(nativeRow(TRX, 'TRX'))).toBe(false);
  });

  it('skips chains that are not shown and unknown or non-CAIP chains', () => {
    const rows = buildUnavailableBalancePlaceholderTokens({
      unavailableChainIds: [BTC, XLM, 'foo:bar', 'not-a-chain'],
      tokens: [],
      isChainShown: (chainId) => chainId !== XLM,
    });

    expect(rows.map(({ chainId }) => chainId)).toStrictEqual([BTC]);
  });
});
