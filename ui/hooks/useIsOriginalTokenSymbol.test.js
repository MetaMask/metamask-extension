import { act } from '@testing-library/react-hooks';
import * as actions from '../store/actions';
import mockState from '../../test/data/mock-state.json';

import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { useIsOriginalTokenSymbol } from './useIsOriginalTokenSymbol';

// Mocking the getTokenSymbol function
jest.mock('../store/actions', () => ({
  getTokenSymbol: jest.fn(),
}));

const state = {
  metamask: {
    ...mockState.metamask,
    tokenList: {
      '0x1234': {
        symbol: 'ABCD',
      },
    },
  },
};

describe('useIsOriginalTokenSymbol', () => {
  it('useIsOriginalTokenSymbol returns correct value when token symbol matches', async () => {
    const tokenAddress = '0x123';
    const tokenSymbol = 'ABC';

    actions.getTokenSymbol.mockResolvedValue('ABC'); // Mock the getTokenSymbol function

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

    actions.getTokenSymbol.mockResolvedValue('DEF'); // Mock the getTokenSymbol function

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

    actions.getTokenSymbol.mockResolvedValue('Should not matter'); // Mock the getTokenSymbol function

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
