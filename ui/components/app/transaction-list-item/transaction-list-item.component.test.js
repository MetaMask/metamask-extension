import { NameType } from '@metamask/name-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as reactRouterDom from 'react-router-dom';
import configureStore from 'redux-mock-store';
import {
  TrustSignalDisplayState,
  useTrustSignals,
} from '../../../hooks/useTrustSignals';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import transactionGroup from '../../../../test/data/mock-pending-transaction-data.json';
import mockLegacySwapTxGroup from '../../../../test/data/swap/mock-legacy-swap-transaction-group.json';
import mockUnifiedSwapTxGroup from '../../../../test/data/swap/mock-unified-swap-transaction-group.json';
import mockBridgeTxData from '../../../../test/data/bridge/mock-bridge-transaction-details.json';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import { getTokens } from '../../../ducks/metamask/metamask';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import {
  getConversionRate,
  getCurrentNetwork,
  getNames,
  getPreferences,
  getSelectedAccount,
  getShouldShowFiat,
  getTokenExchangeRates,
  getSelectedInternalAccount,
  getMarketData,
  accountSupportsCancelSpeedup,
} from '../../../selectors';
import { getNftContractsByAddressByChain } from '../../../selectors/nft';
import { abortTransactionSigning } from '../../../store/actions';
import { setBackgroundConnection } from '../../../store/background-connection';
import TransactionListItem from '.';

const FEE_MARKET_ESTIMATE_RETURN_VALUE = {
  gasEstimateType: GasEstimateTypes.feeMarket,
  gasFeeEstimates: {
    low: {
      minWaitTimeEstimate: 180000,
      maxWaitTimeEstimate: 300000,
      suggestedMaxPriorityFeePerGas: '3',
      suggestedMaxFeePerGas: '53',
    },
    medium: {
      minWaitTimeEstimate: 15000,
      maxWaitTimeEstimate: 60000,
      suggestedMaxPriorityFeePerGas: '7',
      suggestedMaxFeePerGas: '70',
    },
    high: {
      minWaitTimeEstimate: 0,
      maxWaitTimeEstimate: 15000,
      suggestedMaxPriorityFeePerGas: '10',
      suggestedMaxFeePerGas: '100',
    },
    estimatedBaseFee: '50',
  },
  estimatedGasFeeTimeBounds: {},
};

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

jest.mock('../../../hooks/useTrustSignals', () => ({
  useTrustSignals: jest.fn(),
  TrustSignalDisplayState: {
    Malicious: 'malicious',
    Petname: 'petname',
    Verified: 'verified',
    Warning: 'warning',
    Recognized: 'recognized',
    Unknown: 'unknown',
  },
}));

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
});

jest.mock('react', () => {
  const originReact = jest.requireActual('react');
  return {
    ...originReact,
    useLayoutEffect: jest.fn(),
  };
});

jest.mock('../../../store/actions.ts', () => ({
  tryReverseResolveAddress: jest.fn().mockReturnValue({ type: 'TYPE' }),
  abortTransactionSigning: jest.fn(),
}));

const mockStore = configureStore();

const useTrustSignalsMock = jest.mocked(useTrustSignals);

const generateUseSelectorRouter = (opts) => (selector) => {
  if (selector === getConversionRate) {
    return 1;
  } else if (selector === getSelectedAccount) {
    return {
      balance: opts.balance ?? '2AA1EFB94E0000',
    };
  } else if (selector === getTokenExchangeRates) {
    return opts.tokenExchangeRates ?? {};
  } else if (selector === getCurrentNetwork) {
    return { nickname: 'Ethereum Mainnet' };
  } else if (selector === getPreferences) {
    return opts.preferences ?? {};
  } else if (selector === getShouldShowFiat) {
    return opts.shouldShowFiat ?? false;
  } else if (selector === getTokens) {
    return opts.tokens ?? [];
  } else if (selector === selectBridgeHistoryForAccount) {
    return opts.bridgeHistory ?? {};
  } else if (selector === getSelectedInternalAccount) {
    return opts.selectedInternalAccount ?? { address: '0xDefaultAddress' };
  } else if (selector === getNames) {
    return {
      [NameType.ETHEREUM_ADDRESS]: {
        '0xc0ffee254729296a45a3885639ac7e10f9d54979': {
          '0x5': {
            name: 'TestName2',
          },
        },
      },
    };
  } else if (selector === getNftContractsByAddressByChain) {
    return {
      '0x5': {
        '0xc0ffee254729296a45a3885639ac7e10f9d54979': {
          name: 'iZUMi Bond USD',
        },
      },
    };
  } else if (selector === getMarketData) {
    return opts.marketData ?? {};
  } else if (selector === accountSupportsCancelSpeedup) {
    return opts.supportsCancelSpeedup ?? true;
  }
  return undefined;
};

describe('TransactionListItem', () => {
  beforeAll(() => {
    useGasFeeEstimates.mockImplementation(
      () => FEE_MARKET_ESTIMATE_RETURN_VALUE,
    );

    useTrustSignalsMock.mockImplementation((requests) =>
      requests.map(() => ({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      })),
    );
  });

  afterAll(() => {
    useGasFeeEstimates.mockRestore();
  });

  describe('ActivityListItem interactions', () => {
    it('should show the activity details popover and log metrics when the activity list item is clicked', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '0x3',
        }),
      );

      const store = mockStore(mockState);
      const mockTrackEvent = jest.fn();
      const { queryByTestId } = renderWithProvider(
        <MetaMetricsContext.Provider value={mockTrackEvent}>
          <TransactionListItem transactionGroup={transactionGroup} />
        </MetaMetricsContext.Provider>,
        store,
      );
      const activityListItem = queryByTestId('activity-list-item');
      fireEvent.click(activityListItem);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.ActivityDetailsOpened,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          activity_type: 'send',
        },
      });
      const popoverClose = queryByTestId('popover-close');
      fireEvent.click(popoverClose);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.ActivityDetailsClosed,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          activity_type: 'send',
        },
      });
    });
  });

  describe('when account has insufficient balance to cover gas', () => {
    it(`should indicate account has insufficient funds to cover gas price for cancellation of pending transaction`, () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '0x3',
        }),
      );
      const { queryByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={transactionGroup} />,
      );
      expect(queryByTestId('not-enough-gas__tooltip')).toBeInTheDocument();
    });

    it('should not disable "cancel" button when user has sufficient funds', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );
      const { queryByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={transactionGroup} />,
      );
      expect(queryByTestId('not-enough-gas__tooltip')).not.toBeInTheDocument();
    });

    it(`should open the edit gas popover when cancel is clicked`, () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );
      const { getByText, queryByText } = renderWithProvider(
        <TransactionListItem transactionGroup={transactionGroup} />,
      );
      expect(queryByText('Cancel transaction')).not.toBeInTheDocument();

      const cancelButton = getByText('Cancel');
      fireEvent.click(cancelButton);
      expect(getByText('Cancel transaction')).toBeInTheDocument();
    });
  });

  it('hides speed up button if status is approved', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        balance: '2AA1EFB94E0000',
      }),
    );

    const transactionGroupSigning = {
      ...transactionGroup,
      primaryTransaction: {
        ...transactionGroup.primaryTransaction,
        status: TransactionStatus.approved,
      },
    };

    const { queryByTestId } = renderWithProvider(
      <TransactionListItem transactionGroup={transactionGroupSigning} />,
    );

    const speedUpButton = queryByTestId('speed-up-button');
    expect(speedUpButton).not.toBeInTheDocument();
  });

  it('hides speed up button if account does not support cancel or speed up', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        supportsCancelSpeedup: false,
      }),
    );

    const { queryByTestId } = renderWithProvider(
      <TransactionListItem transactionGroup={transactionGroup} />,
    );

    const speedUpButton = queryByTestId('speed-up-button');
    expect(speedUpButton).not.toBeInTheDocument();
  });

  it('aborts transaction signing if cancel button clicked and status is approved', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        balance: '2AA1EFB94E0000',
      }),
    );

    useDispatch.mockReturnValue(jest.fn());

    const transactionGroupSigning = {
      ...transactionGroup,
      primaryTransaction: {
        ...transactionGroup.primaryTransaction,
        status: TransactionStatus.approved,
      },
    };

    const { queryByTestId } = renderWithProvider(
      <TransactionListItem transactionGroup={transactionGroupSigning} />,
    );

    const cancelButton = queryByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(abortTransactionSigning).toHaveBeenCalledTimes(1);
    expect(abortTransactionSigning).toHaveBeenCalledWith(
      transactionGroupSigning.primaryTransaction.id,
    );
  });

  it('should render pending legacy swap tx summary', () => {
    useSelector.mockImplementation(generateUseSelectorRouter({}));
    const { queryByTestId, getByText } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockLegacySwapTxGroup,
          primaryTransaction: {
            ...mockLegacySwapTxGroup.primaryTransaction,
            status: TransactionStatus.approved,
          },
        }}
      />,
      mockStore(mockState),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap USDC to UNISigningCancel',
    );
    expect(getByText('Signing')).toBeInTheDocument();
  });

  it('should render confirmed legacy swap tx summary', () => {
    useSelector.mockImplementation(generateUseSelectorRouter({}));
    const { queryByTestId } = renderWithProvider(
      <TransactionListItem transactionGroup={mockLegacySwapTxGroup} />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap USDC to UNIConfirmed-2 USDC',
    );
  });

  it('should render failed legacy swap tx summary', () => {
    useSelector.mockImplementation(generateUseSelectorRouter({}));
    const { queryByTestId, getByText } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockLegacySwapTxGroup,
          primaryTransaction: {
            ...mockLegacySwapTxGroup.primaryTransaction,
            status: TransactionStatus.failed,
          },
        }}
      />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap USDC to UNIFailed-2 USDC',
    );
    expect(getByText('Failed')).toBeInTheDocument();
  });

  it('should render confirmed unified swap tx summary', () => {
    const { queryByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={jest.fn()}>
        <TransactionListItem transactionGroup={mockUnifiedSwapTxGroup} />
      </MetaMetricsContext.Provider>,
      mockStore(mockState),
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap to Confirmed-0 ETH',
    );
  });

  it('should render failed unified swap tx summary', () => {
    useSelector.mockImplementation(generateUseSelectorRouter({}));
    const { queryByTestId, getByText } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockUnifiedSwapTxGroup,
          primaryTransaction: {
            ...mockUnifiedSwapTxGroup.primaryTransaction,
            status: TransactionStatus.failed,
          },
        }}
      />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Swap to Failed-0 ETH',
    );
    expect(getByText('Failed')).toBeInTheDocument();
  });

  it('should render pending bridge tx summary', () => {
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        bridgeHistory: {
          [srcTxMetaId]: {
            ...bridgeHistoryItem,
            status: {
              ...bridgeHistoryItem.status,
              status: 'PENDING',
            },
          },
        },
      }),
    );
    const { queryByTestId } = renderWithProvider(
      <TransactionListItem
        transactionGroup={{
          ...mockBridgeTxData.transactionGroup,
          primaryTransaction: {
            ...mockBridgeTxData.transactionGroup.primaryTransaction,
            status: TransactionStatus.pending,
          },
        }}
      />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetTransaction 2 of 2-2 USDC',
    );
  });

  it('should render confirmed bridge tx summary', () => {
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        bridgeHistory: {
          [srcTxMetaId]: {
            ...bridgeHistoryItem,
            status: {
              ...bridgeHistoryItem.status,
              status: 'PENDING',
            },
          },
        },
      }),
    );
    const { queryByTestId, getByText } = renderWithProvider(
      <TransactionListItem
        transactionGroup={mockBridgeTxData.transactionGroup}
      />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetTransaction 2 of 2-2 USDC',
    );
    expect(getByText('Transaction 2 of 2')).toBeInTheDocument();
  });

  it('should render completed bridge tx summary', () => {
    const mockPush = jest
      .fn()
      .mockImplementation((...args) => jest.fn(...args));
    jest.spyOn(reactRouterDom, 'useHistory').mockReturnValue({
      push: mockPush,
    });
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        bridgeHistory: {
          [srcTxMetaId]: bridgeHistoryItem,
        },
      }),
    );
    const { queryByTestId, getByTestId } = renderWithProvider(
      <TransactionListItem
        transactionGroup={mockBridgeTxData.transactionGroup}
      />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetConfirmed-2 USDC',
    );

    fireEvent.click(getByTestId('activity-list-item'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/cross-chain/tx-details/ba5f53b0-4e38-11f0-88dc-53f7e315d450',
      state: {
        transactionGroup: mockBridgeTxData.transactionGroup,
        isEarliestNonce: false,
      },
    });
  });

  it('should render failed bridge tx summary', () => {
    const mockPush = jest
      .fn()
      .mockImplementation((...args) => jest.fn(...args));
    jest.spyOn(reactRouterDom, 'useHistory').mockReturnValue({
      push: mockPush,
    });
    const { bridgeHistoryItem, srcTxMetaId } = mockBridgeTxData;
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        bridgeHistory: {
          [srcTxMetaId]: {
            ...bridgeHistoryItem,
            status: {
              ...bridgeHistoryItem.status,
              status: 'FAILED',
            },
          },
        },
      }),
    );
    const failedTransactionGroup = {
      ...mockBridgeTxData.transactionGroup,
      primaryTransaction: {
        ...mockBridgeTxData.transactionGroup.primaryTransaction,
        status: TransactionStatus.failed,
      },
    };
    const { queryByTestId, getByTestId, getByText } = renderWithProvider(
      <TransactionListItem transactionGroup={failedTransactionGroup} />,
    );

    expect(queryByTestId('activity-list-item')).toHaveTextContent(
      '?Bridged to OP MainnetFailed-2 USDC',
    );
    expect(getByText('Failed')).toBeInTheDocument();

    fireEvent.click(getByTestId('activity-list-item'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/cross-chain/tx-details/ba5f53b0-4e38-11f0-88dc-53f7e315d450',
      state: {
        transactionGroup: failedTransactionGroup,
        isEarliestNonce: false,
      },
    });
  });
});
