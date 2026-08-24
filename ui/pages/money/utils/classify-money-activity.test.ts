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
  isIncomingMoneyActivityKind,
  moneyActivityKindToIcon,
  moneyActivityLabelKey,
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

  it('maps confirmed to confirmed', () => {
    expect(
      getMoneyActivityStatus(makeTx({ status: TransactionStatus.confirmed })),
    ).toBe('confirmed');
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

  it('classifies a nested moneyAccountWithdraw batch as sent', () => {
    expect(
      classifyMoneyActivity(
        makeTx({
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.moneyAccountWithdraw }],
        }),
      ),
    ).toBe('sent');
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
  it.each([
    ['deposited', IconName.Add],
    ['received', IconName.Arrow2Down],
    ['converted', IconName.Refresh],
    ['sent', IconName.SwapHorizontal],
  ] as const)('maps %s to the matching icon', (kind, icon) => {
    expect(moneyActivityKindToIcon(kind)).toBe(icon);
  });
});

describe('isIncomingMoneyActivityKind', () => {
  it('treats sent as outgoing', () => {
    expect(isIncomingMoneyActivityKind('sent')).toBe(false);
  });

  it.each(['deposited', 'received', 'converted'] as const)(
    'treats %s as incoming',
    (kind) => {
      expect(isIncomingMoneyActivityKind(kind)).toBe(true);
    },
  );
});
