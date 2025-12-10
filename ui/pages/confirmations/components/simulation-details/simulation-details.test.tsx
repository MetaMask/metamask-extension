import {
  SimulationData,
  SimulationErrorCode,
  TransactionContainerType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { screen } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import React from 'react';
import configureStore from 'redux-mock-store';
import { cloneDeep } from 'lodash';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { AlertMetricsProvider } from '../../../../components/app/alert-system/contexts/alertMetricsContext';
import { BalanceChangeList } from './balance-change-list';
import { SimulationDetails, StaticRow } from './simulation-details';
import { BalanceChange } from './types';
import { useBalanceChanges } from './useBalanceChanges';

const TRANSACTION_ID_MOCK = 'testTransactionId';

const BALANCE_CHANGES_MOCK = [
  { amount: new BigNumber(-123) },
  { amount: new BigNumber(456) },
] as BalanceChange[];

jest.mock('./useBalanceChanges', () => ({
  useBalanceChanges: jest.fn(),
}));

jest.mock('./balance-change-list', () => ({
  BalanceChangeList: jest.fn(() => null),
}));

jest.mock('./useSimulationMetrics');

jest.mock(
  '../../../../components/app/confirm/info/row/alert-row/alert-row',
  () => ({
    ConfirmInfoAlertRow: jest.fn(({ label }) => <>{label}</>),
    getAlertTextColors: jest.fn(() => 'textDefault'),
  }),
);

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(() => ({
    currentConfirmation: {
      id: 'testTransactionId',
    },
  })),
}));

const renderSimulationDetails = (
  simulationData?: Partial<SimulationData>,
  metricsOnly?: boolean,
  staticRows?: StaticRow[],
  transactionMetadata?: Partial<
    TransactionMeta & { smartTransactionStatus?: string }
  >,
) => {
  const trackAlertActionClicked = jest.fn();
  const trackAlertRender = jest.fn();
  const trackInlineAlertClicked = jest.fn();

  const state = cloneDeep(mockState);

  // Extract smartTransactionStatus from transactionMetadata
  const { smartTransactionStatus, ...txMetadata } = transactionMetadata || {};

  if (txMetadata && Object.keys(txMetadata).length > 0) {
    state.metamask.transactions.push({
      id: TRANSACTION_ID_MOCK,
      simulationData,
      ...txMetadata,
    } as never);
  }

  return renderWithProvider(
    <AlertMetricsProvider
      metrics={{
        trackAlertActionClicked,
        trackAlertRender,
        trackInlineAlertClicked,
      }}
    >
      <SimulationDetails
        transaction={
          {
            id: TRANSACTION_ID_MOCK,
            simulationData,
            ...txMetadata,
          } as TransactionMeta
        }
        metricsOnly={metricsOnly}
        staticRows={staticRows}
        isTransactionsRedesign
        smartTransactionStatus={smartTransactionStatus}
      />
    </AlertMetricsProvider>,
    configureStore()(state),
  );
};

describe('SimulationDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: [],
    });
  });

  it('renders skeleton loader when simulation data is not available', () => {
    const { container } = renderSimulationDetails();
    expect(container.querySelector('.mm-skeleton')).toBeInTheDocument();
  });

  it('renders skeleton loader when balance changes are pending', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: true,
      value: [],
    });

    const { container } = renderSimulationDetails({});

    expect(container.querySelector('.mm-skeleton')).toBeInTheDocument();
  });

  it('renders error content when simulation error is reverted', () => {
    renderSimulationDetails({
      error: { code: SimulationErrorCode.Reverted, message: '' },
    });

    expect(
      screen.getByText(/transaction is likely to fail/u),
    ).toBeInTheDocument();
  });

  it('renders no content when simulation error is due to unsupported chain', () => {
    const { container } = renderSimulationDetails({
      error: {
        code: SimulationErrorCode.ChainNotSupported,
        message: 'Chain is not supported',
      },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders error content when simulation error has a generic message', () => {
    renderSimulationDetails({
      error: { message: 'Unknown error' },
    });
    expect(screen.getByText(/Unavailable/u)).toBeInTheDocument();
  });

  it('renders empty content when there are no balance changes with proper alignment', () => {
    renderSimulationDetails({});

    const noChangesText = screen.getByText(/No changes/u);
    expect(noChangesText).toBeInTheDocument();
    expect(noChangesText).toHaveClass('mm-box--width-11/12');
    expect(noChangesText).toHaveClass('mm-text--text-align-right');
  });

  it('passes the correct properties to BalanceChangeList components', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: BALANCE_CHANGES_MOCK,
    });

    renderSimulationDetails({});

    expect(BalanceChangeList).toHaveBeenCalledTimes(2);

    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You send',
        balanceChanges: [BALANCE_CHANGES_MOCK[0]],
      }),
      {},
    );

    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You receive',
        balanceChanges: [BALANCE_CHANGES_MOCK[1]],
      }),
      {},
    );
  });

  it('uses correct heading text based on transaction status', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: BALANCE_CHANGES_MOCK,
    });

    // Test confirmed status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.confirmed,
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You sent',
        balanceChanges: [BALANCE_CHANGES_MOCK[0]],
      }),
      {},
    );

    // Test submitted status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.submitted,
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "You're sending",
        balanceChanges: [BALANCE_CHANGES_MOCK[0]],
      }),
      {},
    );

    // Test default (unapproved status)
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.unapproved,
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You send',
        balanceChanges: [BALANCE_CHANGES_MOCK[0]],
      }),
      {},
    );
  });

  it('prioritizes Smart Transaction status over regular transaction status', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: BALANCE_CHANGES_MOCK,
    });

    // Test: Smart Transaction success should override submitted transaction status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.submitted,
      smartTransactionStatus: 'success',
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You sent', // Should show "You sent" due to Smart Transaction success
        balanceChanges: [BALANCE_CHANGES_MOCK[0]],
      }),
      {},
    );

    // Test: Smart Transaction pending should override unapproved transaction status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.unapproved,
      smartTransactionStatus: 'pending',
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "You're sending", // Should show "You're sending" due to Smart Transaction pending
        balanceChanges: [BALANCE_CHANGES_MOCK[0]],
      }),
      {},
    );
  });

  it('uses correct heading text for incoming balance changes based on transaction status', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: BALANCE_CHANGES_MOCK,
    });

    // Clear previous calls to focus on incoming balance changes
    jest.clearAllMocks();

    // Test confirmed status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.confirmed,
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "You've received",
        balanceChanges: [BALANCE_CHANGES_MOCK[1]],
      }),
      {},
    );

    jest.clearAllMocks();

    // Test submitted status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.submitted,
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "You're receiving",
        balanceChanges: [BALANCE_CHANGES_MOCK[1]],
      }),
      {},
    );

    jest.clearAllMocks();

    // Test default (unapproved status)
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.unapproved,
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You receive',
        balanceChanges: [BALANCE_CHANGES_MOCK[1]],
      }),
      {},
    );
  });

  it('prioritizes Smart Transaction status over regular transaction status for incoming balance changes', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: BALANCE_CHANGES_MOCK,
    });

    jest.clearAllMocks();

    // Test: Smart Transaction success should override submitted transaction status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.submitted,
      smartTransactionStatus: 'success',
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "You've received", // Should show "You've received" due to Smart Transaction success
        balanceChanges: [BALANCE_CHANGES_MOCK[1]],
      }),
      {},
    );

    jest.clearAllMocks();

    // Test: Smart Transaction pending should override unapproved transaction status
    renderSimulationDetails({}, false, [], {
      status: TransactionStatus.unapproved,
      smartTransactionStatus: 'pending',
    });
    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "You're receiving", // Should show "You're receiving" due to Smart Transaction pending
        balanceChanges: [BALANCE_CHANGES_MOCK[1]],
      }),
      {},
    );
  });

  it('does not render any UI elements when metricsOnly is true', () => {
    const { container } = renderSimulationDetails({}, true);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders static rows if provided', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: [],
    });

    const staticRows: StaticRow[] = [
      {
        label: 'Test Label',
        balanceChanges: [
          {
            asset: {
              address: '0x123',
              chainId: '0x321',
              standard: TokenStandard.ERC20,
            },
            amount: new BigNumber(123),
            fiatAmount: 456,
            usdAmount: 789,
          },
        ],
      },
    ];

    renderSimulationDetails({}, false, staticRows);

    expect(BalanceChangeList).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        heading: 'Test Label',
        balanceChanges: staticRows[0].balanceChanges,
      }),
      {},
    );
  });

  it('indicates that simulation details are enforced', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: BALANCE_CHANGES_MOCK,
    });

    const { getByText } = renderSimulationDetails({}, false, [], {
      containerTypes: [TransactionContainerType.EnforcedSimulations],
    });

    expect(getByText('Balance changes')).toBeInTheDocument();
  });
});
