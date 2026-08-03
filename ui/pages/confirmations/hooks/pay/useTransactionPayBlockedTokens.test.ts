import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';

import { useConfirmContext } from '../../context/confirm';
import { selectBlockedPayTokens } from '../../selectors/feature-flags';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));
jest.mock('../../context/confirm');
jest.mock('../../selectors/feature-flags', () => ({
  selectBlockedPayTokens: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUseConfirmContext = jest.mocked(useConfirmContext);
const mockSelectBlockedPayTokens = jest.mocked(selectBlockedPayTokens);

describe('useTransactionPayBlockedTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfirmContext.mockReturnValue({
      currentConfirmation: { type: TransactionType.moneyAccountDeposit },
    } as never);
    mockUseSelector.mockImplementation((selector) =>
      typeof selector === 'function' ? selector({} as never) : undefined,
    );
  });

  it('returns blocked tokens for the current confirmation type', () => {
    const blocked = {
      chainIds: ['0xa4b1'],
      tokens: [{ address: '0xabc', chainId: '0x1' }],
    };
    mockSelectBlockedPayTokens.mockReturnValue(blocked);

    const { result } = renderHook(() => useTransactionPayBlockedTokens());

    expect(result.current).toStrictEqual(blocked);
    expect(mockSelectBlockedPayTokens).toHaveBeenCalledWith(
      {},
      TransactionType.moneyAccountDeposit,
    );
  });
});
