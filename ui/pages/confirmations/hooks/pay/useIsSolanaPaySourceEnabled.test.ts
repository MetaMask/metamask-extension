import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { selectIsSolanaPayEnabled } from '../../selectors/feature-flags';
import { useIsSolanaPaySourceEnabled } from './useIsSolanaPaySourceEnabled';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));
jest.mock('../../selectors/feature-flags', () => ({
  selectIsSolanaPayEnabled: jest.fn(() => true),
}));

function runHook(
  currentConfirmation: Partial<TransactionMeta> | undefined,
  isSolanaPayEnabled: boolean,
) {
  jest
    .mocked(useSelector)
    .mockImplementation((selector) => selector({}) && isSolanaPayEnabled);
  jest.mocked(useConfirmContext).mockReturnValue({
    currentConfirmation,
  } as ReturnType<typeof useConfirmContext>);

  return renderHook(() => useIsSolanaPaySourceEnabled()).result.current;
}

describe('useIsSolanaPaySourceEnabled', () => {
  it('returns true for a Money Account deposit when the Solana Pay flag is on', () => {
    expect(runHook({ type: TransactionType.moneyAccountDeposit }, true)).toBe(
      true,
    );
  });

  it('returns true for a Perps deposit when the Solana Pay flag is on', () => {
    expect(runHook({ type: TransactionType.perpsDeposit }, true)).toBe(true);
  });

  it('returns false when the Solana Pay flag is off', () => {
    expect(runHook({ type: TransactionType.perpsDeposit }, false)).toBe(false);
  });

  it('returns true for a Predict deposit when the Solana Pay flag is on', () => {
    expect(runHook({ type: TransactionType.predictDeposit }, true)).toBe(true);
  });

  it('returns false for an unsupported transaction type', () => {
    expect(runHook({ type: TransactionType.perpsDepositAndOrder }, true)).toBe(
      false,
    );
  });

  it('passes the confirmation to the Solana Pay flag selector', () => {
    const currentConfirmation = { type: TransactionType.perpsDeposit };
    runHook(currentConfirmation, true);

    expect(jest.mocked(selectIsSolanaPayEnabled)).toHaveBeenCalledWith(
      {},
      currentConfirmation,
    );
  });

  it('returns false for a Money Account withdraw', () => {
    expect(runHook({ type: TransactionType.moneyAccountWithdraw }, true)).toBe(
      false,
    );
  });

  it('returns false for a Perps withdraw', () => {
    expect(runHook({ type: TransactionType.perpsWithdraw }, true)).toBe(false);
  });

  it('returns false for a nested post-quote withdraw', () => {
    expect(
      runHook(
        {
          type: TransactionType.batch,
          nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
        },
        true,
      ),
    ).toBe(false);
  });
});
