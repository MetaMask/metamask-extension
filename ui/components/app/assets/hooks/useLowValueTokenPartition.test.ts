import { Hex } from '@metamask/utils';
import { getUseExternalServices } from '#ui/selectors';
import { MUSD_TOKEN_ADDRESS } from '#ui/components/app/musd/constants';
import { type TokenWithFiatAmount } from '#ui/components/app/assets/types';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useLowValueTokenPartition } from './useLowValueTokenPartition';

jest.mock('#ui/selectors', () => ({
  ...jest.requireActual('#ui/selectors'),
  getCurrencyRates: jest.fn(() => ({})),
  getUseExternalServices: jest.fn(() => true),
}));

const createToken = ({
  symbol,
  tokenFiatAmount,
  isNative = false,
  address,
}: {
  symbol: string;
  tokenFiatAmount?: number | null;
  isNative?: boolean;
  address?: Hex;
}): TokenWithFiatAmount => ({
  address:
    address ??
    (`0x${symbol.charCodeAt(0).toString(16).padEnd(40, '0')}` as Hex),
  symbol,
  image: '',
  decimals: 18,
  chainId: '0x1' as Hex,
  title: symbol,
  secondary: null,
  isNative,
  tokenFiatAmount,
});

describe('useLowValueTokenPartition', () => {
  beforeEach(() => {
    jest.mocked(getUseExternalServices).mockReturnValue(true);
  });

  it('returns all tokens as visible when disabled', () => {
    const tokens = [
      createToken({ symbol: 'USDC', tokenFiatAmount: 25 }),
      createToken({ symbol: 'DUST', tokenFiatAmount: 0.5 }),
    ];

    const { result } = renderHookWithProvider(() =>
      useLowValueTokenPartition({ tokens, enabled: false }),
    );

    expect(result.current.visibleTokens).toEqual(tokens);
    expect(result.current.lowValueTokens).toEqual([]);
  });

  it('buckets tokens priced below the threshold', () => {
    const token = createToken({ symbol: 'DUST', tokenFiatAmount: 0.5 });

    const { result } = renderHookWithProvider(() =>
      useLowValueTokenPartition({ tokens: [token], enabled: true }),
    );

    expect(result.current.visibleTokens).toEqual([]);
    expect(result.current.lowValueTokens).toEqual([token]);
  });

  it('buckets unpriced tokens when external services are enabled and another token is priced', () => {
    const pricedToken = createToken({ symbol: 'USDC', tokenFiatAmount: 25 });
    const unpricedToken = createToken({ symbol: 'SPAM' });

    const { result } = renderHookWithProvider(() =>
      useLowValueTokenPartition({
        tokens: [pricedToken, unpricedToken],
        enabled: true,
      }),
    );

    expect(result.current.visibleTokens).toEqual([pricedToken]);
    expect(result.current.lowValueTokens).toEqual([unpricedToken]);
  });

  it('does not bucket unpriced tokens when no token in the list is priced', () => {
    const unpricedToken = createToken({ symbol: 'SPAM' });

    const { result } = renderHookWithProvider(() =>
      useLowValueTokenPartition({ tokens: [unpricedToken], enabled: true }),
    );

    expect(result.current.visibleTokens).toEqual([unpricedToken]);
    expect(result.current.lowValueTokens).toEqual([]);
  });

  it('does not partition when basic functionality is off', () => {
    jest.mocked(getUseExternalServices).mockReturnValue(false);

    const pricedToken = createToken({ symbol: 'USDC', tokenFiatAmount: 25 });
    const unpricedToken = createToken({ symbol: 'SPAM' });
    const lowValueToken = createToken({ symbol: 'DUST', tokenFiatAmount: 0.5 });

    const { result } = renderHookWithProvider(() =>
      useLowValueTokenPartition({
        tokens: [pricedToken, unpricedToken, lowValueToken],
        enabled: true,
      }),
    );

    expect(result.current.visibleTokens).toEqual([
      pricedToken,
      unpricedToken,
      lowValueToken,
    ]);
    expect(result.current.lowValueTokens).toEqual([]);
  });

  it('does not bucket native or mUSD tokens', () => {
    const nativeToken = createToken({
      symbol: 'ETH',
      tokenFiatAmount: 0.5,
      isNative: true,
    });
    const musdToken = createToken({
      symbol: 'MUSD',
      address: MUSD_TOKEN_ADDRESS,
      tokenFiatAmount: undefined,
    });

    const nativeResult = renderHookWithProvider(() =>
      useLowValueTokenPartition({ tokens: [nativeToken], enabled: true }),
    ).result;
    const musdResult = renderHookWithProvider(() =>
      useLowValueTokenPartition({ tokens: [musdToken], enabled: true }),
    ).result;

    expect(nativeResult.current.visibleTokens).toEqual([nativeToken]);
    expect(nativeResult.current.lowValueTokens).toEqual([]);
    expect(musdResult.current.visibleTokens).toEqual([musdToken]);
    expect(musdResult.current.lowValueTokens).toEqual([]);
  });

  it('buckets tokens priced at zero as under threshold, not unpriced', () => {
    const pricedToken = createToken({ symbol: 'USDC', tokenFiatAmount: 25 });
    const zeroPricedToken = createToken({ symbol: 'FREE', tokenFiatAmount: 0 });

    const { result } = renderHookWithProvider(() =>
      useLowValueTokenPartition({
        tokens: [pricedToken, zeroPricedToken],
        enabled: true,
      }),
    );

    expect(result.current.visibleTokens).toEqual([pricedToken]);
    expect(result.current.lowValueTokens).toEqual([zeroPricedToken]);
  });
});
