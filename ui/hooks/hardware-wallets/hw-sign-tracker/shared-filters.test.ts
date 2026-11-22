import { TransactionType } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import {
  createTxMeta,
  TARGET_FROM,
} from '../../../../test/helpers/hw-sign-tracker';
import {
  BRIDGE_TRANSACTION_TYPES,
  BUNDLE_FEE_TRANSACTION_TYPES,
  BUNDLE_SEND_TRANSACTION_TYPES,
  BUNDLE_TRANSACTION_TYPES,
} from './constants';
import { matchesTx, classifySignedTransactionType } from './shared-filters';

describe('matchesTx', () => {
  it('returns false when targetFrom is undefined', () => {
    expect(matchesTx(createTxMeta(), undefined)).toBe(false);
  });

  it('returns false when from address does not match', () => {
    expect(
      matchesTx(
        createTxMeta({ from: '0x0000000000000000000000000000000000000000' }),
        TARGET_FROM,
      ),
    ).toBe(false);
  });

  it('returns false when transaction type is not a tracked type', () => {
    expect(
      matchesTx(
        createTxMeta({ type: TransactionType.contractInteraction }),
        TARGET_FROM,
      ),
    ).toBe(false);
  });

  it('returns true for matching address and bridge approval type', () => {
    expect(matchesTx(createTxMeta(), TARGET_FROM)).toBe(true);
  });

  it('returns true for matching address and swap type', () => {
    expect(
      matchesTx(createTxMeta({ type: TransactionType.swap }), TARGET_FROM),
    ).toBe(true);
  });

  it('returns true for matching address when type filtering is disabled', () => {
    expect(
      matchesTx(
        createTxMeta({ type: TransactionType.simpleSend }),
        TARGET_FROM,
        null,
      ),
    ).toBe(true);
  });

  it('returns false for send type when restricted to bridge transaction types', () => {
    expect(
      matchesTx(
        createTxMeta({ type: TransactionType.simpleSend }),
        TARGET_FROM,
        BRIDGE_TRANSACTION_TYPES,
      ),
    ).toBe(false);
  });

  it('performs case-insensitive address comparison', () => {
    const txMeta = createTxMeta({
      from: TARGET_FROM.toUpperCase(),
    });
    expect(matchesTx(txMeta, TARGET_FROM)).toBe(true);
  });
});

describe('classifySignedTransactionType', () => {
  it('returns FirstSignatureSubmitted for bridge approval', () => {
    expect(
      classifySignedTransactionType(TransactionType.bridgeApproval),
    ).toEqual({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('returns FirstSignatureSubmitted for swap approval', () => {
    expect(classifySignedTransactionType(TransactionType.swapApproval)).toEqual(
      {
        type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
      },
    );
  });

  it('returns TransactionSubmitted for bridge trade', () => {
    expect(classifySignedTransactionType(TransactionType.bridge)).toEqual({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('returns TransactionSubmitted for swap trade', () => {
    expect(classifySignedTransactionType(TransactionType.swap)).toEqual({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('returns null for untracked type', () => {
    expect(
      classifySignedTransactionType(TransactionType.contractInteraction),
    ).toBeNull();
  });

  it('does not classify bundle transaction types by default', () => {
    expect(
      classifySignedTransactionType(TransactionType.gasPayment),
    ).toBeNull();
    expect(
      classifySignedTransactionType(TransactionType.simpleSend),
    ).toBeNull();
  });
});

describe('bundle transaction type constants', () => {
  it('includes known fee and send transaction types', () => {
    expect(BUNDLE_FEE_TRANSACTION_TYPES.has(TransactionType.gasPayment)).toBe(
      true,
    );
    expect(BUNDLE_SEND_TRANSACTION_TYPES.has(TransactionType.simpleSend)).toBe(
      true,
    );
    expect(
      BUNDLE_SEND_TRANSACTION_TYPES.has(TransactionType.tokenMethodTransfer),
    ).toBe(true);
    expect(BUNDLE_TRANSACTION_TYPES.has(TransactionType.gasPayment)).toBe(true);
    expect(BUNDLE_TRANSACTION_TYPES.has(TransactionType.simpleSend)).toBe(true);
  });
});
