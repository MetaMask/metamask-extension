import { renderHook } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';
import { useTransactionPayingAccount } from './useTransactionPayingAccount';

jest.mock('./useTransactionAccountOverride');
jest.mock('./useTransactionMetadataRequest');

const FROM_ADDRESS = '0x1234567890123456789012345678901234567890';
const OVERRIDE_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

const mockUseTransactionAccountOverride = jest.mocked(
  useTransactionAccountOverride,
);
const mockUseTransactionMetadataRequestOptional = jest.mocked(
  useTransactionMetadataRequestOptional,
);

function mockTransaction(
  type: TransactionType,
  nestedTypes: TransactionType[] = [],
) {
  mockUseTransactionMetadataRequestOptional.mockReturnValue({
    id: 'tx-1',
    type,
    txParams: { from: FROM_ADDRESS },
    nestedTransactions: nestedTypes.map((nestedType) => ({
      type: nestedType,
    })),
  } as unknown as TransactionMeta);
}

describe('useTransactionPayingAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTransactionAccountOverride.mockReturnValue(undefined);
  });

  it('returns txParams.from when there is no account override', () => {
    mockTransaction(TransactionType.contractInteraction);

    const { result } = renderHook(() => useTransactionPayingAccount());

    expect(result.current).toBe(FROM_ADDRESS);
  });

  it('returns the account override for a Money Account deposit', () => {
    mockTransaction(TransactionType.batch, [
      TransactionType.moneyAccountDeposit,
    ]);
    mockUseTransactionAccountOverride.mockReturnValue(OVERRIDE_ADDRESS);

    const { result } = renderHook(() => useTransactionPayingAccount());

    expect(result.current).toBe(OVERRIDE_ADDRESS);
  });

  it('keeps txParams.from for a post-quote Perps withdraw', () => {
    mockTransaction(TransactionType.perpsWithdraw);
    mockUseTransactionAccountOverride.mockReturnValue(OVERRIDE_ADDRESS);

    const { result } = renderHook(() => useTransactionPayingAccount());

    expect(result.current).toBe(FROM_ADDRESS);
  });

  it('keeps txParams.from for a nested Money Account withdraw', () => {
    mockTransaction(TransactionType.batch, [
      TransactionType.moneyAccountWithdraw,
    ]);
    mockUseTransactionAccountOverride.mockReturnValue(OVERRIDE_ADDRESS);

    const { result } = renderHook(() => useTransactionPayingAccount());

    expect(result.current).toBe(FROM_ADDRESS);
  });

  it('returns undefined when there is no transaction', () => {
    mockUseTransactionMetadataRequestOptional.mockReturnValue(undefined);

    const { result } = renderHook(() => useTransactionPayingAccount());

    expect(result.current).toBeUndefined();
  });
});
