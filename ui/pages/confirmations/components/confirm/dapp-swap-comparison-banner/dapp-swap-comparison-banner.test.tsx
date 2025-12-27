/* eslint-disable @typescript-eslint/naming-convention */
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
import * as DappSwapContext from '../../../context/dapp-swap';
import { useDappSwapComparisonRewardText } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useDappSwapCheck } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapCheck';
import { DappSwapComparisonBanner } from './dapp-swap-comparison-banner';

jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    })),
  }),
);

jest.mock(
  '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonInfo',
  () => ({
    useDappSwapComparisonInfo: jest.fn(() => ({
      selectedQuote: { destTokenAmount: 100 },
    })),
  }),
);

const mockCaptureDappSwapComparisonDisplayProperties = jest.fn();
jest.mock(
  '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonMetrics',
  () => ({
    useDappSwapComparisonMetrics: jest.fn(() => ({
      captureSwapSubmit: jest.fn(),
      captureDappSwapComparisonDisplayProperties:
        mockCaptureDappSwapComparisonDisplayProperties,
    })),
  }),
);

jest.mock(
  '../../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText',
  () => ({
    useDappSwapComparisonRewardText: jest.fn(),
  }),
);

jest.mock(
  '../../../hooks/transactions/dapp-swap-comparison/useDappSwapCheck',
  () => ({
    useDappSwapCheck: jest.fn(() => ({
      isSwapToBeCompared: true,
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
  const mockUseDappSwapCheck = jest.mocked(useDappSwapCheck);
  const mockGetRemoteFeatureFlags = jest.mocked(getRemoteFeatureFlags);
  const mockUseDappSwapComparisonInfo = jest.mocked(useDappSwapComparisonInfo);
  const mockUseDappSwapComparisonRewardText = jest.mocked(
    useDappSwapComparisonRewardText,
  );

  beforeEach(() => {
    mockCaptureDappSwapComparisonDisplayProperties.mockClear();
    mockGetRemoteFeatureFlags.mockReturnValue({
      dappSwapMetrics: { enabled: true },
      dappSwapUi: { enabled: true, threshold: 0.01 },
    });
    mockUseDappSwapComparisonRewardText.mockReturnValue(null);
    mockUseDappSwapCheck.mockReturnValue({
      isSwapToBeCompared: true,
    });
  });

  it('renders component without errors', () => {
    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuoteValueDifference: 0.1,
      gasDifference: 0.01,
      tokenAmountDifference: 0.01,
    } as unknown as ReturnType<typeof useDappSwapComparisonInfo>);
    const { getByText } = render();
    expect(getByText('Market rate')).toBeInTheDocument();
    expect(getByText('MetaMask Swap')).toBeInTheDocument();
    expect(getByText('Save with MetaMask Swaps')).toBeInTheDocument();
    expect(getByText('Save $0.10')).toBeInTheDocument();
    expect(
      getByText('Network fees refunded on failed swaps'),
    ).toBeInTheDocument();
  });

  it('renders undefined for incorrect origin', () => {
    mockUseDappSwapCheck.mockReturnValue({
      isSwapToBeCompared: false,
    });
    const { container } = render({ origin: 'www.test.com' });
    expect(container).toBeEmptyDOMElement();
  });

  it('call function to update quote swap when user clicks on Metamask Swap button', () => {
    const mockSetQuotedSwapDisplayedInInfo = jest.fn();
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      selectedQuote: quote as unknown as QuoteResponse,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: mockSetQuotedSwapDisplayedInInfo,
    } as unknown as ReturnType<typeof DappSwapContext.useDappSwapContext>);

    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuote: quote as unknown as QuoteResponse,
      selectedQuoteValueDifference: 0.1,
      gasDifference: 0.01,
      tokenAmountDifference: 0.01,
    } as unknown as ReturnType<typeof useDappSwapComparisonInfo>);
    const { getByText } = render();
    const quoteSwapButton = getByText('MetaMask Swap');
    fireEvent.click(quoteSwapButton);
    expect(mockSetQuotedSwapDisplayedInInfo).toHaveBeenCalledTimes(1);
    expect(
      mockCaptureDappSwapComparisonDisplayProperties,
    ).toHaveBeenCalledTimes(2);
    expect(
      mockCaptureDappSwapComparisonDisplayProperties,
    ).toHaveBeenNthCalledWith(1, {
      swap_mm_cta_displayed: 'true',
    });
    expect(
      mockCaptureDappSwapComparisonDisplayProperties,
    ).toHaveBeenNthCalledWith(2, {
      swap_mm_opened: 'true',
    });
  });

  it('does not render component if dappSwapUi is not enabled', () => {
    mockGetRemoteFeatureFlags.mockReturnValue({
      dappSwapMetrics: { enabled: true },
      dappSwapUi: { enabled: false, threshold: 0.01 },
    });
    const { container } = render();
    expect(container.firstChild).toBeNull();
  });

  it('call function to update quote swap clicks on Market rate button', () => {
    const mockSetQuotedSwapDisplayedInInfo = jest.fn();
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      selectedQuote: quote as unknown as QuoteResponse,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: mockSetQuotedSwapDisplayedInInfo,
    } as unknown as ReturnType<typeof DappSwapContext.useDappSwapContext>);

    mockUseDappSwapComparisonInfo.mockReturnValue({
      selectedQuote: quote as unknown as QuoteResponse,
      selectedQuoteValueDifference: 0.1,
      gasDifference: 0.01,
      tokenAmountDifference: 0.01,
      destinationTokenSymbol: 'TEST',
    } as unknown as ReturnType<typeof useDappSwapComparisonInfo>);
    const { getByTestId } = render();
    const metamaskSwapTab = getByTestId('metamask-swap-tab');
    fireEvent.click(metamaskSwapTab);
    const marketRateTab = getByTestId('market-rate-tab');
    fireEvent.click(marketRateTab);
    expect(mockSetQuotedSwapDisplayedInInfo).toHaveBeenCalledTimes(2);
    expect(mockSetQuotedSwapDisplayedInInfo).toHaveBeenNthCalledWith(1, true);
    expect(mockSetQuotedSwapDisplayedInInfo).toHaveBeenNthCalledWith(2, false);
    expect(
      mockCaptureDappSwapComparisonDisplayProperties,
    ).toHaveBeenCalledTimes(2);
    expect(
      mockCaptureDappSwapComparisonDisplayProperties,
    ).toHaveBeenNthCalledWith(1, {
      swap_mm_cta_displayed: 'true',
    });
    expect(
      mockCaptureDappSwapComparisonDisplayProperties,
    ).toHaveBeenNthCalledWith(2, {
      swap_mm_opened: 'true',
    });
  });

  it('renders rewards text when it is provided', () => {
    mockUseDappSwapComparisonRewardText.mockReturnValue({
      text: 'Earn 100 points',
      estimatedPoints: 100,
    });
    const { getByText } = render();
    expect(getByText(/Earn 100 points/u)).toBeInTheDocument();
    expect(getByText('Save and earn with MetaMask Swaps')).toBeInTheDocument();
  });
});
