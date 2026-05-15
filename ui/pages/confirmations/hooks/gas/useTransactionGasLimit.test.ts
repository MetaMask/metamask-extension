import { renderHook } from '@testing-library/react-hooks';
import { type TransactionMeta } from '@metamask/transaction-controller';

import { useDappSwapContextOptional } from '../../context/dapp-swap';
import { useTransactionGasLimit } from './useTransactionGasLimit';

jest.mock('../../context/dapp-swap', () => ({
  useDappSwapContextOptional: jest.fn(),
}));

const mockUseDappSwapContextOptional = jest.mocked(useDappSwapContextOptional);

const BASE_TRANSACTION_META = {
  chainId: '0x1',
  networkClientId: 'mainnet',
  txParams: { gas: '0x5208' },
} as unknown as TransactionMeta;

describe('useTransactionGasLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDappSwapContextOptional.mockReturnValue(undefined);
  });

  it('prefers gasUsed when no container types are set', () => {
    const { result } = renderHook(() =>
      useTransactionGasLimit({
        ...BASE_TRANSACTION_META,
        gasUsed: '0x7530',
        gasLimitNoBuffer: '0x6000',
      } as unknown as TransactionMeta),
    );

    expect(result.current.gasLimit).toBe('0x7530');
  });

  it('falls back to gasLimitNoBuffer when gasUsed is missing', () => {
    const { result } = renderHook(() =>
      useTransactionGasLimit({
        ...BASE_TRANSACTION_META,
        gasLimitNoBuffer: '0x6000',
      } as unknown as TransactionMeta),
    );

    expect(result.current.gasLimit).toBe('0x6000');
  });

  it('falls back to txParams.gas when both gasUsed and gasLimitNoBuffer are missing', () => {
    const { result } = renderHook(() =>
      useTransactionGasLimit(BASE_TRANSACTION_META),
    );

    expect(result.current.gasLimit).toBe('0x5208');
  });

  it('returns 0x0 when no gas fields are available', () => {
    const { result } = renderHook(() =>
      useTransactionGasLimit({
        chainId: '0x1',
        networkClientId: 'mainnet',
        txParams: {},
      } as unknown as TransactionMeta),
    );

    expect(result.current.gasLimit).toBe('0x0');
  });

  it('prefers txParams.gas over simulation fields when container types are set', () => {
    const { result } = renderHook(() =>
      useTransactionGasLimit({
        ...BASE_TRANSACTION_META,
        containerTypes: ['EnforcedSimulations'],
        gasUsed: '0x7530',
        gasLimitNoBuffer: '0x6000',
        txParams: { gas: '0x1fbd0' },
      } as unknown as TransactionMeta),
    );

    expect(result.current.gasLimit).toBe('0x1fbd0');
  });

  it('falls back to 0x0 when container types are set but txParams.gas is missing', () => {
    const { result } = renderHook(() =>
      useTransactionGasLimit({
        ...BASE_TRANSACTION_META,
        containerTypes: ['EnforcedSimulations'],
        gasLimitNoBuffer: '0x6000',
        txParams: {},
      } as unknown as TransactionMeta),
    );

    expect(result.current.gasLimit).toBe('0x0');
  });

  it('uses quoted gas limit when a swap quote is displayed', () => {
    mockUseDappSwapContextOptional.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: {
        approval: { gasLimit: 100 },
        trade: { gasLimit: 50 },
      },
    } as unknown as ReturnType<typeof useDappSwapContextOptional>);

    const { result } = renderHook(() =>
      useTransactionGasLimit({
        ...BASE_TRANSACTION_META,
        gasUsed: '0x7530',
      } as unknown as TransactionMeta),
    );

    // 100 + 50 = 150 = 0x96
    expect(result.current.gasLimit).toBe('0x96');
    expect(result.current.quotedGasLimit).toBe('0x96');
  });

  it('ignores quoted gas limit when container types are set', () => {
    mockUseDappSwapContextOptional.mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: {
        approval: { gasLimit: 100 },
        trade: { gasLimit: 50 },
      },
    } as unknown as ReturnType<typeof useDappSwapContextOptional>);

    const { result } = renderHook(() =>
      useTransactionGasLimit({
        ...BASE_TRANSACTION_META,
        containerTypes: ['EnforcedSimulations'],
        txParams: { gas: '0x1fbd0' },
      } as unknown as TransactionMeta),
    );

    expect(result.current.gasLimit).toBe('0x1fbd0');
  });
});
