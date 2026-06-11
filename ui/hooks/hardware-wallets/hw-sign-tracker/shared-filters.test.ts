import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { matchesTx, classifySignedEvent } from './shared-filters';

describe('matchesTx', () => {
  const TARGET_FROM = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';

  function createTxMeta(
    overrides: Partial<{
      from: string;
      type: TransactionType;
    }> = {},
  ): TransactionMeta {
    return {
      id: 'tx-1',
      status: TransactionStatus.signed,
      type: overrides.type ?? TransactionType.bridgeApproval,
      txParams: { from: overrides.from ?? TARGET_FROM },
      batchId: undefined,
      chainId: '0x1',
      networkClientId: 'test',
      time: 0,
    };
  }

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

  it('returns false when transaction type is not a batch type', () => {
    expect(
      matchesTx(
        createTxMeta({ type: TransactionType.simpleSend }),
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

  it('performs case-insensitive address comparison', () => {
    const txMeta = createTxMeta({
      from: TARGET_FROM.toUpperCase(),
    });
    expect(matchesTx(txMeta, TARGET_FROM)).toBe(true);
  });
});

describe('classifySignedEvent', () => {
  it('returns FirstSignatureSubmitted for bridge approval', () => {
    expect(classifySignedEvent(TransactionType.bridgeApproval)).toEqual({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('returns FirstSignatureSubmitted for swap approval', () => {
    expect(classifySignedEvent(TransactionType.swapApproval)).toEqual({
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted,
    });
  });

  it('returns TransactionSubmitted for bridge trade', () => {
    expect(classifySignedEvent(TransactionType.bridge)).toEqual({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('returns TransactionSubmitted for swap trade', () => {
    expect(classifySignedEvent(TransactionType.swap)).toEqual({
      type: HardwareWalletSignatureEvent.TransactionSubmitted,
    });
  });

  it('returns null for non-batch type', () => {
    expect(classifySignedEvent(TransactionType.simpleSend)).toBeNull();
  });
});
