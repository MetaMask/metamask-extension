import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import {
  getPendingTransactionActionVisibility,
  isIntentBridgeActivity,
} from './pending-transaction-actions';

const basePrimaryTransaction = {
  id: '1',
  status: TransactionStatus.submitted,
} as TransactionMeta;

describe('isIntentBridgeActivity', () => {
  it('returns true when bridge history has an intent quote', () => {
    expect(
      isIntentBridgeActivity({
        quote: { intent: { orderUid: 'abc' } },
      }),
    ).toBe(true);
  });

  it('returns false when bridge history has no intent', () => {
    expect(isIntentBridgeActivity({ quote: {} })).toBe(false);
    expect(isIntentBridgeActivity(undefined)).toBe(false);
  });
});

describe('getPendingTransactionActionVisibility', () => {
  const baseParams = {
    hasCancelled: false,
    primaryTransaction: basePrimaryTransaction,
    shouldShowSpeedUp: true,
    isBridgeTx: false,
    hasIntentBridgeActivity: false,
  };

  it('shows cancel and speed up for a standard pending transaction', () => {
    expect(getPendingTransactionActionVisibility(baseParams)).toStrictEqual({
      showCancel: true,
      showSpeedUp: true,
      speedUpLabel: 'speedUp',
    });
  });

  it('hides speed up when shouldShowSpeedUp is false', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        shouldShowSpeedUp: false,
      }).showSpeedUp,
    ).toBe(false);
  });

  it('hides speed up while signing (approved status)', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        primaryTransaction: {
          ...basePrimaryTransaction,
          status: TransactionStatus.approved,
        },
      }).showSpeedUp,
    ).toBe(false);
  });

  it('shows cancel but hides speed up while signing (approved status)', () => {
    const visibility = getPendingTransactionActionVisibility({
      ...baseParams,
      primaryTransaction: {
        ...basePrimaryTransaction,
        status: TransactionStatus.approved,
      },
    });

    expect(visibility.showCancel).toBe(true);
    expect(visibility.showSpeedUp).toBe(false);
  });

  it('hides cancel for bridge transactions', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        isBridgeTx: true,
      }),
    ).toStrictEqual({
      showCancel: false,
      showSpeedUp: true,
      speedUpLabel: 'speedUp',
    });
  });

  it('hides cancel for intent bridge activity', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        hasIntentBridgeActivity: true,
      }).showCancel,
    ).toBe(false);
  });

  it('hides both actions when a gas fee token is selected', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        primaryTransaction: {
          ...basePrimaryTransaction,
          selectedGasFeeToken: '0xtoken',
        },
      }),
    ).toStrictEqual({
      showCancel: false,
      showSpeedUp: false,
      speedUpLabel: 'speedUp',
    });
  });

  it('uses speedUpCancellation label when the group has a cancel tx', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        hasCancelled: true,
      }).speedUpLabel,
    ).toBe('speedUpCancellation');
  });

  it('hides cancel when the group has a cancel tx', () => {
    expect(
      getPendingTransactionActionVisibility({
        ...baseParams,
        hasCancelled: true,
      }).showCancel,
    ).toBe(false);
  });
});
