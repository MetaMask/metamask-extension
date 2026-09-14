import { describe, expect, it } from '@jest/globals';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { IconName } from '@metamask/design-system-react';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import {
  classifyMoneyActivity,
  getMoneyActivityStatus,
  isEphemeralFailedTransaction,
  isIncomingMoneyActivityKind,
  isOnChainRevertedTransaction,
  moneyActivityKindToIcon,
  moneyActivityLabelKey,
  type MoneyActivityKind,
} from './classify-money-activity';

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

function makeTx(extra: Record<string, unknown>): TransactionMeta {
  return {
    id: 'tx-1',
    chainId: '0x1',
    ...extra,
  } as unknown as TransactionMeta;
}

describe('getMoneyActivityStatus', () => {
  it.each([
    TransactionStatus.unapproved,
    TransactionStatus.approved,
    TransactionStatus.signed,
    TransactionStatus.submitted,
  ])('maps %s to pending', (status) => {
    expect(getMoneyActivityStatus(makeTx({ status }))).toBe('pending');
  });

  it.each([
    TransactionStatus.failed,
    TransactionStatus.dropped,
    TransactionStatus.rejected,
    TransactionStatus.cancelled,
  ])('maps %s to failed', (status) => {
    expect(getMoneyActivityStatus(makeTx({ status }))).toBe('failed');
  });

  it('maps failed with a successful receipt to confirmed', () => {
    expect(
      getMoneyActivityStatus(
        makeTx({
          status: TransactionStatus.failed,
          txReceipt: { status: '0x1' },
        }),
      ),
    ).toBe('confirmed');
  });

  it('maps confirmed with a reverted receipt to failed', () => {
    expect(
      getMoneyActivityStatus(
        makeTx({
          status: TransactionStatus.confirmed,
          txReceipt: { status: '0x0' },
        }),
      ),
    ).toBe('failed');
  });
});

describe('isOnChainRevertedTransaction', () => {
  it('detects the OnChainFailureError TransactionController records on revert', () => {
    expect(
      isOnChainRevertedTransaction(
        makeTx({
          status: TransactionStatus.failed,
          error: {
            name: 'OnChainFailureError',
            message: 'Transaction failed on-chain: slippage',
          },
        }),
      ),
    ).toBe(true);
  });

  it('detects a decoded revert receipt', () => {
    expect(
      isOnChainRevertedTransaction(
        makeTx({
          status: TransactionStatus.failed,
          revert: { receipt: { message: 'slippage', data: '0x' } },
        }),
      ),
    ).toBe(true);
  });

  it('treats a local RPC failure as not reverted', () => {
    expect(
      isOnChainRevertedTransaction(
        makeTx({
          status: TransactionStatus.failed,
          error: { name: 'Error', message: 'Relay execute: 500' },
        }),
      ),
    ).toBe(false);
  });
});

describe('isEphemeralFailedTransaction', () => {
  it('is true for a failed tx with no on-chain signal', () => {
    expect(
      isEphemeralFailedTransaction(
        makeTx({
          status: TransactionStatus.failed,
          error: { name: 'Error', message: 'Relay execute: 500' },
        }),
      ),
    ).toBe(true);
  });

  it('is false for an on-chain revert reported via error name', () => {
    expect(
      isEphemeralFailedTransaction(
        makeTx({
          status: TransactionStatus.failed,
          error: { name: 'OnChainFailureError', message: 'reverted' },
        }),
      ),
    ).toBe(false);
  });

  it('is false for non-failed statuses', () => {
    expect(
      isEphemeralFailedTransaction(
        makeTx({ status: TransactionStatus.confirmed }),
      ),
    ).toBe(false);
  });
});

describe('classifyMoneyActivity', () => {
  it('prefers an explicit title key over transaction type', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          moneyActivityTitleKey: 'sent',
        }),
      ),
    ).toBe('sent');
  });

  it('classifies a crypto moneyAccountDeposit as a conversion', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          metamaskPay: { tokenAddress: USDC_ADDRESS, chainId: '0x1' },
        }),
      ),
    ).toBe('converted');
  });

  it('classifies a fiat on-ramp moneyAccountDeposit as a deposit', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          metamaskPay: { fiat: { orderId: 'o-1', provider: 'transak' } },
        }),
      ),
    ).toBe('deposited');
  });

  it('classifies an mUSD-funded moneyAccountDeposit as a deposit', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          metamaskPay: { tokenAddress: MUSD_TOKEN_ADDRESS, chainId: '0x1' },
        }),
      ),
    ).toBe('deposited');
  });

  it.each([
    TransactionType.incoming,
    TransactionType.tokenMethodTransfer,
    TransactionType.tokenMethodTransferFrom,
  ])('classifies %s as received', (type) => {
    expect(classifyMoneyActivity(makeTx({ type }))).toBe('received');
  });

  it.each([TransactionType.moneyAccountWithdraw, TransactionType.simpleSend])(
    'classifies %s as sent',
    (type) => {
      expect(classifyMoneyActivity(makeTx({ type }))).toBe('sent');
    },
  );

  it('classifies a Pay-funded contract interaction as sent', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.contractInteraction,
          metamaskPay: { tokenAddress: MUSD_TOKEN_ADDRESS, chainId: '0x8f' },
        }),
      ),
    ).toBe('sent');
  });

  it('classifies a Perps deposit funded from the Money Account as sent', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.perpsDeposit,
          metamaskPay: { tokenAddress: MUSD_TOKEN_ADDRESS, chainId: '0x8f' },
        }),
      ),
    ).toBe('sent');
  });

  it('classifies a Perps withdraw landing in the Money Account as deposited', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
          metamaskPay: { tokenAddress: MUSD_TOKEN_ADDRESS, chainId: '0x8f' },
        }),
      ),
    ).toBe('deposited');
  });

  it('classifies an unknown type without Pay metadata as received', () => {
    expect(
      classifyMoneyActivity(
        makeTx({ type: TransactionType.contractInteraction }),
      ),
    ).toBe('received');
  });

  it('classifies a nested moneyAccountDeposit on a contract-interaction parent as a deposit', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.contractInteraction,
          nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
          metamaskPay: { tokenAddress: MUSD_TOKEN_ADDRESS, chainId: '0x8f' },
        }),
      ),
    ).toBe('deposited');
  });
});

describe('moneyActivityLabelKey', () => {
  it('returns the confirmed label key', () => {
    expect(moneyActivityLabelKey('deposited', 'confirmed')).toBe(
      'moneyActivityDeposited',
    );
  });

  it('returns the pending label key', () => {
    expect(moneyActivityLabelKey('converted', 'pending')).toBe(
      'moneyActivityConverting',
    );
  });

  it('returns the failed label key', () => {
    expect(moneyActivityLabelKey('sent', 'failed')).toBe(
      'moneyActivitySendFailed',
    );
  });

  it('falls back to the confirmed label when a status has no dedicated key', () => {
    expect(moneyActivityLabelKey('received', 'failed')).toBe(
      'moneyActivityReceived',
    );
  });
});

describe('moneyActivityKindToIcon', () => {
  it.each<[MoneyActivityKind, IconName]>([
    ['deposited', IconName.Add],
    ['received', IconName.Arrow2Down],
    ['converted', IconName.Refresh],
    ['sent', IconName.SwapHorizontal],
  ])('maps %s to the matching icon', (kind, icon) => {
    expect(moneyActivityKindToIcon(kind)).toBe(icon);
  });
});

describe('isIncomingMoneyActivityKind', () => {
  it('treats sent as outgoing', () => {
    expect(isIncomingMoneyActivityKind('sent')).toBe(false);
  });

  it.each<MoneyActivityKind>(['deposited', 'received', 'converted'])(
    'treats %s as incoming',
    (kind) => {
      expect(isIncomingMoneyActivityKind(kind)).toBe(true);
    },
  );
});
