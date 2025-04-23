import { BigNumber } from 'bignumber.js';
import { createBridgeMockStore } from '../../../../test/jest/mock-store';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import usePriceImpactAlert from './usePriceImpactAlert';

jest.mock('../../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../../ducks/bridge/selectors'),
  getBridgeQuotes: jest.fn(),
}));

const renderUsePriceImpactAlert = (mockStoreOverrides = {}) => {
  return renderHookWithProvider(
    () => usePriceImpactAlert(),
    createBridgeMockStore(mockStoreOverrides),
  );
};

describe('usePriceImpactAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns displayPriceImpactAlert equals true when slippage is bigger than 5%', async () => {
    const mockActiveQuote = {
      adjustedReturn: {
        amount: new BigNumber(100),
        valueInCurrency: new BigNumber(95),
        usd: new BigNumber(95),
      },
      sentAmount: {
        amount: new BigNumber(100),
        valueInCurrency: new BigNumber(100),
        usd: new BigNumber(100),
      },
    };

    jest
      .requireMock('../../../ducks/bridge/selectors')
      .getBridgeQuotes.mockReturnValue({ activeQuote: mockActiveQuote });

    const { result } = renderUsePriceImpactAlert();

    expect(result.current).toEqual({
      activeQuote: mockActiveQuote,
      displayPriceImpactAlert: true,
    });
  });

  it('returns displayPriceImpactAlert equals false when slippage is lower than 5%', async () => {
    const mockActiveQuote = {
      adjustedReturn: {
        amount: new BigNumber(100),
        valueInCurrency: new BigNumber(98),
        usd: new BigNumber(98),
      },
      sentAmount: {
        amount: new BigNumber(100),
        valueInCurrency: new BigNumber(100),
        usd: new BigNumber(100),
      },
    };

    jest
      .requireMock('../../../ducks/bridge/selectors')
      .getBridgeQuotes.mockReturnValue({ activeQuote: mockActiveQuote });

    const { result } = renderUsePriceImpactAlert();

    expect(result.current).toEqual({
      activeQuote: mockActiveQuote,
      displayPriceImpactAlert: false,
    });
  });
});
