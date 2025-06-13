import {
  SimulationData,
  SimulationErrorCode,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { screen } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import React from 'react';
import configureStore from 'redux-mock-store';
import { TokenStandard } from '../../../../../shared/constants/transaction';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { AlertMetricsProvider } from '../../../../components/app/alert-system/contexts/alertMetricsContext';
import { BalanceChangeList } from './balance-change-list';
import { SimulationDetails, StaticRow } from './simulation-details';
import { BalanceChange } from './types';
import { useBalanceChanges } from './useBalanceChanges';

const store = configureStore()(mockState);

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
) => {
  const trackAlertActionClicked = jest.fn();
  const trackAlertRender = jest.fn();
  const trackInlineAlertClicked = jest.fn();

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
          { id: 'testTransactionId', simulationData } as TransactionMeta
        }
        metricsOnly={metricsOnly}
        staticRows={staticRows}
      />
    </AlertMetricsProvider>,
    store,
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

  it('renders loading indicator when simulation data is not available', () => {
    renderSimulationDetails();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders loading indicator when balance changes are pending', () => {
    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: true,
      value: [],
    });

    renderSimulationDetails({});

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
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

  it('renders empty content when there are no balance changes', () => {
    renderSimulationDetails({});

    expect(screen.getByText(/No changes/u)).toBeInTheDocument();
  });

  it('passes the correct properties to BalanceChangeList components', () => {
    const balanceChangesMock = [
      { amount: new BigNumber(-123) },
      { amount: new BigNumber(456) },
    ] as BalanceChange[];

    (useBalanceChanges as jest.Mock).mockReturnValue({
      pending: false,
      value: balanceChangesMock,
    });

    renderSimulationDetails({});

    expect(BalanceChangeList).toHaveBeenCalledTimes(2);

    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You send',
        balanceChanges: [balanceChangesMock[0]],
      }),
      {},
    );

    expect(BalanceChangeList).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: 'You receive',
        balanceChanges: [balanceChangesMock[1]],
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
});
