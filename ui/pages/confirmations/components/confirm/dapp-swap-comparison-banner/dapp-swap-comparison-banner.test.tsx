import React from 'react';
import configureMockStore from 'redux-mock-store';
import { QuoteResponse } from '@metamask/bridge-controller';
import { fireEvent } from '@testing-library/react';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { mockSwapConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getRemoteFeatureFlags } from '../../../../../selectors/remote-feature-flags';
import { Confirmation } from '../../../types/confirm';
import { useDappSwapComparisonInfo } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo';
import * as SwapCheckHook from '../../../hooks/transactions/dapp-swap-comparison/useSwapCheck';
import { DappSwapComparisonBanner } from './dapp-swap-comparison-banner';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockUpdateTransaction = jest.fn();
jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  updateTransaction: () => mockUpdateTransaction,
}));

jest.mock(
  '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo',
  () => ({
    useDappSwapComparisonInfo: jest.fn(() => ({
      selectedQuote: { destTokenAmount: 100 },
    })),
  }),
);

jest.mock('../../../../../selectors/remote-feature-flags');

const quote = {
  quote: {
    aggregator: 'openocean',
    requestId:
      '0xf5fe1ea0c87b44825dfc89cc60c3398f1cf83eb49a07e491029e00cb72090ef2',
    bridgeId: 'okx',
    srcChainId: 42161,
    destChainId: 42161,
    srcTokenAmount: '9913',
    destTokenAmount: '1004000',
    minDestTokenAmount: '972870',
    walletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
    destWalletAddress: '0x178239802520a9C99DCBD791f81326B70298d629',
    bridges: ['okx'],
    protocols: ['okx'],
    steps: [],
    slippage: 2,
  },
  approval: {
    chainId: 42161,
    to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    from: '0x178239802520a9C99DCBD791f81326B70298d629',
    value: '0x0',
    data: '',
    gasLimit: 62000,
  },
  trade: {
    chainId: 42161,
    to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
    from: '0x178239802520a9C99DCBD791f81326B70298d629',
    value: '0x0',
    data: '',
    gasLimit: 80000,
  },
  estimatedProcessingTimeInSeconds: 0,
};

function render(args: Record<string, string> = {}) {
  const state = getMockConfirmStateForTransaction({
    ...mockSwapConfirmation,
    ...args,
  } as Confirmation);

  const mockStore = configureMockStore()(state);

  return renderWithConfirmContextProvider(
    <DappSwapComparisonBanner />,
    mockStore,
  );
}

describe('<DappSwapComparisonBanner />', () => {
  const mockGetRemoteFeatureFlags = jest.mocked(getRemoteFeatureFlags);
  const mockUseDappSwapComparisonInfo = jest.mocked(useDappSwapComparisonInfo);

  beforeEach(() => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      dappSwapMetrics: { enabled: true },
      dappSwapUi: { enabled: true, threshold: 0.01 },
    });
  });

  it('renders component without errors', () => {
    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuoteValueDifference: 0.1,
      gasDifference: 0.01,
      tokenAmountDifference: 0.01,
      destinationTokenSymbol: 'TEST',
    } as ReturnType<typeof useDappSwapComparisonInfo>);
    const { getByText } = render();
    expect(getByText('Market rate')).toBeInTheDocument();
    expect(getByText('Metamask Swap')).toBeInTheDocument();
    expect(getByText('Save and earn with MetaMask Swaps')).toBeInTheDocument();
    expect(getByText('Save $0.02')).toBeInTheDocument();
    expect(
      getByText('Network fees refunded on failed swaps'),
    ).toBeInTheDocument();
  });

  it('renders undefined for incorrect origin', () => {
    const { container } = render({ origin: 'www.test.com' });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders undefined if suitable quote is not found', () => {
    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuoteValueDifference: 0.001,
    } as ReturnType<typeof useDappSwapComparisonInfo>);
    const { container } = render();
    expect(container).toBeEmptyDOMElement();
  });

  it('call function to update confirmation when user clicks on Metamask Swap button', () => {
    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuote: quote as unknown as QuoteResponse,
      selectedQuoteValueDifference: 0.1,
      gasDifference: 0.01,
      tokenAmountDifference: 0.01,
      destinationTokenSymbol: 'TEST',
    } as ReturnType<typeof useDappSwapComparisonInfo>);
    const { getByText } = render();
    const quoteSwapButton = getByText('Metamask Swap');
    fireEvent.click(quoteSwapButton);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('call function to update confirmation when user clicks on Market rate button', () => {
    jest.spyOn(SwapCheckHook, 'useSwapCheck').mockReturnValue({
      isQuotedSwap: true,
    });
    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuote: quote as unknown as QuoteResponse,
      selectedQuoteValueDifference: 0.1,
      gasDifference: 0.01,
      tokenAmountDifference: 0.01,
      destinationTokenSymbol: 'TEST',
    } as ReturnType<typeof useDappSwapComparisonInfo>);
    const { getByText } = render();
    const quoteSwapButton = getByText('Market rate');
    fireEvent.click(quoteSwapButton);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
