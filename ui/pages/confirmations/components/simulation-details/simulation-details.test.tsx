import configureStore from 'redux-mock-store';
import React from 'react';
import { screen } from '@testing-library/react';
import {
  SimulationData,
  SimulationErrorCode,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { SimulationDetails } from './simulation-details';
import { useBalanceChanges } from './useBalanceChanges';
import { BalanceChangeList } from './balance-change-list';
import { BalanceChange } from './types';

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
) =>
  renderWithProvider(
    <SimulationDetails
      transaction={
        { id: 'testTransactionId', simulationData } as TransactionMeta
      }
      metricsOnly={metricsOnly}
    />,
    store,
  );

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
});
