import React from 'react';
import { render } from '@testing-library/react';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { useBridgeTxHistoryData } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { TransactionListItemPendingActions } from './pending-transaction-actions';

jest.mock('../../../hooks/usePendingTransactionActions');
jest.mock('../../../hooks/bridge/useBridgeTxHistoryData');

const mockUsePendingTransactionActions = jest.mocked(
  usePendingTransactionActions,
);
const mockUseBridgeTxHistoryData = jest.mocked(useBridgeTxHistoryData);

let capturedProps: {
  onCancel: (event: React.MouseEvent) => void;
  speedUp: { onClick: (event: React.MouseEvent) => void };
} | null = null;

jest.mock(
  '../../../components/app/pending-transaction-action-buttons/pending-transaction-action-buttons',
  () => ({
    PendingTransactionActionButtons: (props: typeof capturedProps) => {
      capturedProps = props;
      return <div data-testid="action-buttons" />;
    },
  }),
);

function buildTransactionGroup(
  overrides: { primaryId?: string; isSmartTransaction?: boolean } = {},
): TransactionGroup {
  const { primaryId = 'tx-1', isSmartTransaction = false } = overrides;
  return {
    primaryTransaction: { id: primaryId, isSmartTransaction },
    initialTransaction: { id: primaryId, isSmartTransaction },
  } as unknown as TransactionGroup;
}

function mockActions(
  overrides: Partial<ReturnType<typeof usePendingTransactionActions>> = {},
) {
  mockUsePendingTransactionActions.mockReturnValue({
    showCancel: true,
    onCancel: jest.fn(),
    speedUp: { show: true, label: 'speedUp', onClick: jest.fn() },
    ...overrides,
  });
}

describe('TransactionListItemPendingActions', () => {
  const renderComponent = (
    transactionGroup: TransactionGroup,
    onGasModalMetaId = jest.fn(),
  ) =>
    render(
      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        setEditGasMode={jest.fn()}
        onGasModalMetaId={onGasModalMetaId}
      />,
    );

  beforeEach(() => {
    capturedProps = null;
    jest.clearAllMocks();
    mockUseBridgeTxHistoryData.mockReturnValue({
      bridgeHistoryItem: undefined,
    });
    mockActions();
  });

  it('renders nothing for smart transactions', () => {
    const { queryByTestId } = renderComponent(
      buildTransactionGroup({ isSmartTransaction: true }),
    );

    expect(queryByTestId('action-buttons')).not.toBeInTheDocument();
  });

  it('renders nothing when neither cancel nor speed up is available', () => {
    mockActions({
      showCancel: false,
      speedUp: { show: false, label: 'speedUp', onClick: jest.fn() },
    });

    const { queryByTestId } = renderComponent(buildTransactionGroup());

    expect(queryByTestId('action-buttons')).not.toBeInTheDocument();
  });

  it('targets the primary transaction id when delegating to the cancel handler', () => {
    const onCancel = jest.fn();
    const onGasModalMetaId = jest.fn();
    mockActions({ onCancel });

    renderComponent(
      buildTransactionGroup({ primaryId: 'tx-42' }),
      onGasModalMetaId,
    );

    capturedProps?.onCancel({} as React.MouseEvent);

    expect(onGasModalMetaId).toHaveBeenCalledWith('tx-42');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('targets the primary transaction id when delegating to the speed up handler', () => {
    const onSpeedUp = jest.fn();
    const onGasModalMetaId = jest.fn();
    mockActions({
      speedUp: { show: true, label: 'speedUp', onClick: onSpeedUp },
    });

    renderComponent(
      buildTransactionGroup({ primaryId: 'tx-7' }),
      onGasModalMetaId,
    );

    capturedProps?.speedUp.onClick({} as React.MouseEvent);

    expect(onGasModalMetaId).toHaveBeenCalledWith('tx-7');
    expect(onSpeedUp).toHaveBeenCalledTimes(1);
  });
});
