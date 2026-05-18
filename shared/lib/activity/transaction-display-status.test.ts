import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../constants/transaction';
import {
  getTransactionDisplayStatusKey,
  shouldShowActivityListStatusSubtitle,
} from './transaction-display-status';

describe('getTransactionDisplayStatusKey', () => {
  it('maps approved to signing', () => {
    expect(getTransactionDisplayStatusKey(TransactionStatus.approved)).toBe(
      'signing',
    );
  });

  it('maps submitted to pending when earliest nonce', () => {
    expect(
      getTransactionDisplayStatusKey(TransactionStatus.submitted, true),
    ).toBe(TransactionGroupStatus.pending);
  });

  it('maps submitted to queued when not earliest nonce', () => {
    expect(
      getTransactionDisplayStatusKey(TransactionStatus.submitted, false),
    ).toBe('queued');
  });
});

describe('shouldShowActivityListStatusSubtitle', () => {
  it('returns false for undefined, empty string, and confirmed', () => {
    expect(shouldShowActivityListStatusSubtitle(undefined)).toBe(false);
    expect(shouldShowActivityListStatusSubtitle('')).toBe(false);
    expect(
      shouldShowActivityListStatusSubtitle(TransactionStatus.confirmed),
    ).toBe(false);
  });

  it('returns true for keys that render a status subtitle', () => {
    expect(shouldShowActivityListStatusSubtitle('queued')).toBe(true);
    expect(shouldShowActivityListStatusSubtitle('signing')).toBe(true);
    expect(
      shouldShowActivityListStatusSubtitle(TransactionStatus.failed),
    ).toBe(true);
    expect(
      shouldShowActivityListStatusSubtitle(TransactionGroupStatus.cancelled),
    ).toBe(true);
  });

  it('returns false for pending (earliest nonce) key', () => {
    expect(
      shouldShowActivityListStatusSubtitle(TransactionGroupStatus.pending),
    ).toBe(false);
  });
});
