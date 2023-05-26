import React from 'react';
import { useSelector } from 'react-redux';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import mockState from '../../../../test/data/mock-state.json';
import transactionGroup from '../../../../test/data/mock-pending-transaction-data.json';
import {
  getConversionRate,
  getSelectedAccount,
  getTokenExchangeRates,
  getPreferences,
  getShouldShowFiat,
} from '../../../selectors';
import {
  renderWithProvider,
  setBackgroundConnection,
} from '../../../../test/jest';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import { getTokens } from '../../../ducks/metamask/metamask';
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
    useDispatch: () => jest.fn(),
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
  describe('when account has insufficient balance to cover gas', () => {
    beforeAll(() => {
      useGasFeeEstimates.mockImplementation(
        () => FEE_MARKET_ESTIMATE_RETURN_VALUE,
      );
    });

    afterAll(() => {
      useGasFeeEstimates.mockRestore();
    });

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
        ...(transactionGroup.primaryTransaction.custodyId = '1'),
      };

      const { queryByTestId } = renderWithProvider(
        <TransactionListItem transactionGroup={newTransactionGroup} />,
      );
      expect(queryByTestId('custody-icon')).toBeInTheDocument();
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
        ...(transactionGroup.primaryTransaction.custodyId = '1'),
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
  });
});
