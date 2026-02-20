import { act } from '@testing-library/react-hooks';
import * as tokenUtil from '../helpers/utils/token-util';
import mockState from '../../test/data/mock-state.json';

import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useIsOriginalTokenSymbol } from './useIsOriginalTokenSymbol';

jest.mock('../helpers/utils/token-util', () => ({
  getSymbolAndDecimalsAndName: jest.fn(),
}));

const state = {
  metamask: {
    ...mockState.metamask,
    tokensChainsCache: {
      '0x5': {
        data: {
          '0x1234': {
            address: '0x1234',
            symbol: 'ABCD',
          },
        },
      },
    },
  },
};

describe('useIsOriginalTokenSymbol', () => {
  it('useIsOriginalTokenSymbol returns correct value when token symbol matches', async () => {
    const tokenAddress = '0x123';
    const tokenSymbol = 'ABC';

    tokenUtil.getSymbolAndDecimalsAndName.mockResolvedValue({ symbol: 'ABC' });

    let result;

    await act(async () => {
      result = renderHookWithProvider(
        () => useIsOriginalTokenSymbol(tokenAddress, tokenSymbol),
        state,
      );
    });

    // Expect the hook to return true when the symbol matches the original symbol
    expect(result.result.current).toBe(true);
  });

  it('useIsOriginalTokenSymbol returns correct value when token symbol does not match', async () => {
    const tokenAddress = '0x456';
    const tokenSymbol = 'XYZ';

    tokenUtil.getSymbolAndDecimalsAndName.mockResolvedValue({ symbol: 'DEF' });

    let result;

    await act(async () => {
      result = renderHookWithProvider(
        () => useIsOriginalTokenSymbol(tokenAddress, tokenSymbol),
        state,
      );
    });

    // Expect the hook to return false when the symbol matches the original symbol
    expect(result.result.current).toBe(false);
  });

  it('useIsOriginalTokenSymbol uses cached value when available', async () => {
    const tokenAddress = '0x1234';
    const tokenSymbol = 'ABCD';

    tokenUtil.getSymbolAndDecimalsAndName.mockResolvedValue({
      symbol: 'Should not matter',
    });

    let result;

    await act(async () => {
      result = renderHookWithProvider(
        () => useIsOriginalTokenSymbol(tokenAddress, tokenSymbol),
        state,
      );
    });

    // Expect the hook to return true when the symbol matches the original symbol
    expect(result.result.current).toBe(true);
  });
});
