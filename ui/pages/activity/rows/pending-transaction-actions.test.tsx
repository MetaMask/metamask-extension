import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../../../shared/lib/multichain/types';
import { usePendingTransactionActions } from '../../../hooks/usePendingTransactionActions';
import { selectBridgeHistoryItemForTx } from '../../../selectors/activity';
import { TransactionListItemPendingActions } from './pending-transaction-actions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('../../../hooks/usePendingTransactionActions');
jest.mock('../../../selectors/activity', () => ({
  selectBridgeHistoryItemForTx: jest.fn(),
}));

const mockUsePendingTransactionActions = jest.mocked(
  usePendingTransactionActions,
);
const mockUseSelector = jest.mocked(useSelector);
const mockSelectBridgeHistoryItemForTx = jest.mocked(
  selectBridgeHistoryItemForTx,
);

let capturedProps: {
  onCancel: (event: React.MouseEvent) => void;
  speedUp: { show: boolean; onClick: (event: React.MouseEvent) => void };
  showCancel: boolean;
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
  overrides: {
    primaryId?: string;
    isSmartTransaction?: boolean;
    type?: TransactionType;
    primaryType?: TransactionType;
  } = {},
): TransactionGroup {
  const {
    primaryId = 'tx-1',
    isSmartTransaction = false,
    type = TransactionType.simpleSend,
    primaryType = type,
  } = overrides;
  return {
    primaryTransaction: {
      id: primaryId,
      isSmartTransaction,
      type: primaryType,
    },
    initialTransaction: { id: primaryId, isSmartTransaction, type },
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
    mockSelectBridgeHistoryItemForTx.mockReturnValue(undefined);
    mockUseSelector.mockImplementation((selector) => selector({} as never));
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

  it('hides speed up for swaps, bridges, and their approvals', () => {
    for (const type of [
      TransactionType.swap,
      TransactionType.bridge,
      TransactionType.swapApproval,
      TransactionType.bridgeApproval,
    ]) {
      mockActions();
      const { unmount } = renderComponent(buildTransactionGroup({ type }));

      expect(capturedProps?.speedUp.show).toBe(false);
      expect(capturedProps?.showCancel).toBe(true);
      unmount();

      mockActions({ showCancel: false });

      const { queryByTestId, unmount: unmountWithoutCancel } = renderComponent(
        buildTransactionGroup({ type }),
      );

      expect(queryByTestId('action-buttons')).not.toBeInTheDocument();
      unmountWithoutCancel();

      mockActions();
      const { unmount: unmountReplacement } = renderComponent(
        buildTransactionGroup({ type, primaryType: TransactionType.retry }),
      );

      expect(capturedProps?.speedUp.show).toBe(false);
      unmountReplacement();
    }
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
