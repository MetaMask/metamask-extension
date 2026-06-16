import { TransactionType } from '@metamask/transaction-controller';
import { HardwareWalletSignatureEvent } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import {
  createTxMeta,
  TARGET_FROM,
} from '../../../../test/helpers/hw-sign-tracker';
import { matchesTx, classifySignedEvent } from './shared-filters';

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
