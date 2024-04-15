import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { TransactionStatus } from '@metamask/transaction-controller';
import mockState from '../../../../test/data/mock-state.json';
import transactionGroup from '../../../../test/data/mock-pending-transaction-data.json';
import {
  getConversionRate,
  getSelectedAccount,
  getTokenExchangeRates,
  getPreferences,
  getShouldShowFiat,
  getCurrentNetwork,
} from '../../../selectors';
import { renderWithProvider } from '../../../../test/jest';
import { setBackgroundConnection } from '../../../store/background-connection';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import { getTokens } from '../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { abortTransactionSigning } from '../../../store/actions';
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

jest.mock('../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
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

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianTransactionDeepLink: jest
      .fn()
      .mockReturnValue({ type: 'TYPE' }),
  }),
}));

const mockStore = configureStore();

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
    return (
      opts.preferences ?? {
        useNativeCurrencyAsPrimaryCurrency: true,
      }
    );
  } else if (selector === getShouldShowFiat) {
    return opts.shouldShowFiat ?? false;
  } else if (selector === getTokens) {
    return opts.tokens ?? [];
  }
  return undefined;
};

describe('TransactionListItem', () => {
  beforeAll(() => {
    useGasFeeEstimates.mockImplementation(
      () => FEE_MARKET_ESTIMATE_RETURN_VALUE,
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

    it('should have a custodian Tx and show the custody icon', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );

      const newTransactionGroup = {
        ...transactionGroup,
        primaryTransaction: {
          ...transactionGroup.primaryTransaction,
          custodyId: '1',
        },
      };

      const { getByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={newTransactionGroup} />,
      );
      const custodyIcon = getByTestId('custody-icon');
      const custodyIconBadge = getByTestId('custody-icon-badge');

      expect(custodyIcon).toBeInTheDocument();
      expect(custodyIconBadge).toHaveClass('mm-box--color-primary-default');
    });

    it('should display correctly the custody icon if status is signed', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );

      const newTransactionGroup = {
        ...transactionGroup,
        primaryTransaction: {
          ...transactionGroup.primaryTransaction,
          custodyId: '1',
          status: TransactionStatus.signed,
        },
      };

      const { getByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={newTransactionGroup} />,
      );

      const custodyIconBadge = getByTestId('custody-icon-badge');

      expect(custodyIconBadge).toHaveClass('mm-box--color-icon-alternative');
    });

    it('should display correctly the custody icon if status is rejected', () => {
      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );

      const newTransactionGroup = {
        ...transactionGroup,
        primaryTransaction: {
          ...transactionGroup.primaryTransaction,
          custodyId: '1',
          status: TransactionStatus.rejected,
        },
      };

      const { getByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={newTransactionGroup} />,
      );

      const custodyIconBadge = getByTestId('custody-icon-badge');

      expect(custodyIconBadge).toHaveClass('mm-box--color-error-default');
    });

    it('should click the custody list item and view the send screen', () => {
      const store = mockStore(mockState);

      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );

      const newTransactionGroup = {
        ...transactionGroup,
        primaryTransaction: {
          ...transactionGroup.primaryTransaction,
          custodyId: '1',
        },
      };

      const { queryByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={newTransactionGroup} />,
        store,
      );

      const custodyListItem = queryByTestId('custody-icon');
      fireEvent.click(custodyListItem);

      const sendTextExists = screen.queryAllByText('Send');
      expect(sendTextExists).toBeTruthy();
    });

    it('should not show the cancel tx button when the tx is from a custodian', () => {
      const store = mockStore(mockState);

      useSelector.mockImplementation(
        generateUseSelectorRouter({
          balance: '2AA1EFB94E0000',
        }),
      );

      const newTransactionGroup = {
        ...transactionGroup,
        primaryTransaction: {
          ...transactionGroup.primaryTransaction,
          custodyId: '1',
        },
      };

      const { queryByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={newTransactionGroup} />,
        store,
      );

      const cancelButton = queryByTestId('cancel-button');
      expect(cancelButton).not.toBeInTheDocument();
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
});
