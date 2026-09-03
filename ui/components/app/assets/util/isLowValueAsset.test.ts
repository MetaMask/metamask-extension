import { Hex } from '@metamask/utils';
import { MUSD_TOKEN_ADDRESS } from '../../musd/constants';
import { type TokenWithFiatAmount } from '../types';
import { partitionLowValueTokens } from './isLowValueAsset';

const defaultOptions = {
  lowValueAssetFiatThreshold: 1,
  useExternalServices: true,
};

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

describe('partitionLowValueTokens', () => {
  it('buckets tokens priced below the threshold', () => {
    const token = createToken({ symbol: 'DUST', tokenFiatAmount: 0.5 });

    const result = partitionLowValueTokens([token], defaultOptions);

    expect(result.visibleTokens).toEqual([]);
    expect(result.lowValueTokens).toEqual([token]);
  });

  it('buckets unpriced tokens when external services are enabled and another token is priced', () => {
    const pricedToken = createToken({ symbol: 'USDC', tokenFiatAmount: 25 });
    const unpricedToken = createToken({ symbol: 'SPAM' });

    const result = partitionLowValueTokens(
      [pricedToken, unpricedToken],
      defaultOptions,
    );

    expect(result.visibleTokens).toEqual([pricedToken]);
    expect(result.lowValueTokens).toEqual([unpricedToken]);
  });

  it('does not bucket unpriced tokens when no token in the list is priced', () => {
    const unpricedToken = createToken({ symbol: 'SPAM' });

    const result = partitionLowValueTokens([unpricedToken], defaultOptions);

    expect(result.visibleTokens).toEqual([unpricedToken]);
    expect(result.lowValueTokens).toEqual([]);
  });

  it('does not bucket unpriced tokens when basic functionality is off', () => {
    const pricedToken = createToken({ symbol: 'USDC', tokenFiatAmount: 25 });
    const unpricedToken = createToken({ symbol: 'SPAM' });

    const result = partitionLowValueTokens([pricedToken, unpricedToken], {
      ...defaultOptions,
      useExternalServices: false,
    });

    expect(result.visibleTokens).toEqual([pricedToken, unpricedToken]);
    expect(result.lowValueTokens).toEqual([]);
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

    const nativeResult = partitionLowValueTokens([nativeToken], defaultOptions);
    const musdResult = partitionLowValueTokens([musdToken], defaultOptions);

    expect(nativeResult.visibleTokens).toEqual([nativeToken]);
    expect(nativeResult.lowValueTokens).toEqual([]);
    expect(musdResult.visibleTokens).toEqual([musdToken]);
    expect(musdResult.lowValueTokens).toEqual([]);
  });

  it('buckets tokens priced at zero as under threshold, not unpriced', () => {
    const pricedToken = createToken({ symbol: 'USDC', tokenFiatAmount: 25 });
    const zeroPricedToken = createToken({ symbol: 'FREE', tokenFiatAmount: 0 });

    const result = partitionLowValueTokens(
      [pricedToken, zeroPricedToken],
      defaultOptions,
    );

    expect(result.visibleTokens).toEqual([pricedToken]);
    expect(result.lowValueTokens).toEqual([zeroPricedToken]);
  });
});
