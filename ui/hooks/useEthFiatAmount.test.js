import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import mockState from '../../test/data/mock-state.json';
import { useEthFiatAmount } from './useEthFiatAmount';

function getState(conversionRate) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currencyRates: {
        ...mockState.metamask.currencyRates,
        ETH: {
          ...mockState.metamask.currencyRates.ETH,
          conversionRate,
        },
      },
    },
  };
}

describe('useEthFiatAmount', () => {
  it('does not throw when conversionRate has more than 15 significant digits', () => {
    const state = getState(0.07086574003221964);

    let result;
    expect(() => {
      result = renderHookWithProvider(
        () => useEthFiatAmount('1', { showFiat: true }, true),
        state,
      );
    }).not.toThrow();

    expect(result.result.current).toBe('$0.07');
  });
});
