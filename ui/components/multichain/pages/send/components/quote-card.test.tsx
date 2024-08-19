import React from 'react';
import { render, screen } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  getCurrentDraftTransaction,
  getBestQuote,
} from '../../../../../ducks/send';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useEthFeeData from './quote-card/hooks/useEthFeeData';
import useTranslatedNetworkName from './quote-card/hooks/useTranslatedNetworkName';
import useGetConversionRate from './quote-card/hooks/useGetConversionRate';
import { QuoteCard } from './quote-card';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('./quote-card/hooks/useEthFeeData', () => jest.fn());
jest.mock('./quote-card/hooks/useTranslatedNetworkName', () => jest.fn());
jest.mock('./quote-card/hooks/useGetConversionRate', () => jest.fn());

describe('QuoteCard', () => {
  const useDispatchMock = useDispatch as jest.Mock;
  const useSelectorMock = useSelector as jest.Mock;
  const useI18nContextMock = useI18nContext as jest.Mock;
  const useEthFeeDataMock = useEthFeeData as jest.Mock;
  const useTranslatedNetworkNameMock = useTranslatedNetworkName as jest.Mock;
  const useGetConversionRateMock = useGetConversionRate as jest.Mock;

  const scrollRef = { current: document.createElement('div') };
  const mockDispatch = jest.fn();
  const trackEventMock = jest.fn();

  beforeEach(() => {
    useDispatchMock.mockReturnValue(mockDispatch);
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentDraftTransaction) {
        return { isSwapQuoteLoading: false };
      }
      if (selector === getBestQuote) {
        return {
          gasParams: { maxGas: 21000 },
          approvalNeeded: { gas: '0x0' },
          fee: 0.5,
        };
      }
      return undefined;
    });
    useI18nContextMock.mockReturnValue((key: string) => key);
    useEthFeeDataMock.mockReturnValue({
      formattedEthGasFee: '0.01 ETH',
      formattedFiatGasFee: '$10',
    });
    useTranslatedNetworkNameMock.mockReturnValue('Ethereum');
    useGetConversionRateMock.mockReturnValue('1 ETH = 2000 USD');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders quote card with correct data', () => {
    render(
      <MetaMetricsContext.Provider value={trackEventMock}>
        <QuoteCard scrollRef={scrollRef} />
      </MetaMetricsContext.Provider>,
    );

    expect(screen.getByTestId('quote-card__conversion-rate')).toHaveTextContent(
      '1 ETH = 2000 USD',
    );
    expect(screen.getByTestId('quote-card__gas-fee')).toHaveTextContent(
      '0.01 ETH',
    );
    expect(screen.getByTestId('quote-card__fiat-gas-fee')).toHaveTextContent(
      '≈ $10',
    );
  });

  it('do not fetch quote on render', () => {
    render(
      <MetaMetricsContext.Provider value={trackEventMock}>
        <QuoteCard scrollRef={scrollRef} />
      </MetaMetricsContext.Provider>,
    );

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('shows fetching quote text when loading', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getCurrentDraftTransaction) {
        return { isSwapQuoteLoading: true };
      }
      if (selector === getBestQuote) {
        return undefined;
      }
      return undefined;
    });

    render(
      <MetaMetricsContext.Provider value={trackEventMock}>
        <QuoteCard scrollRef={scrollRef} />
      </MetaMetricsContext.Provider>,
    );

    expect(screen.getByText('swapFetchingQuotes')).toBeInTheDocument();
  });
});
