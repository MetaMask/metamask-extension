/* eslint-disable @typescript-eslint/naming-convention */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { ConfirmContext } from '../../context/confirm';
import type { Asset } from '../../types/send';
import { useSendTokens } from '../send/useSendTokens';
import { usePostQuoteWithdrawTokenFilter } from './useWithdrawTokenFilter';

jest.mock('../send/useSendTokens');

const mockStore = configureStore([]);
const mockUseSendTokens = jest.mocked(useSendTokens);

const ALL_TOKENS_MOCK = [
  {
    address: '0xaaa',
    balance: '1',
    chainId: '0x1',
    symbol: 'TKNA',
  },
  {
    address: '0xbbb',
    balance: '0',
    chainId: '0x1',
    symbol: 'TKNB',
  },
] as Asset[];

function renderUsePostQuoteWithdrawTokenFilter({
  transactionMeta,
  type = TransactionType.perpsWithdraw,
  postQuoteFlags = {
    default: { enabled: false },
  },
}: {
  transactionMeta?: TransactionMeta;
  type?: TransactionType;
  postQuoteFlags?: Record<string, unknown>;
} = {}) {
  const store = mockStore({
    metamask: {
      remoteFeatureFlags: {
        confirmations_pay_post_quote: postQuoteFlags,
      },
    },
  });

  const confirmContextValue = {
    currentConfirmation:
      transactionMeta ??
      ({
        id: 'tx-id',
        type,
        txParams: {},
      } as TransactionMeta),
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: jest.fn(),
  };

  const wrapper = ({ children }: React.PropsWithChildren<unknown>) => (
    <Provider store={store}>
      <ConfirmContext.Provider value={confirmContextValue as never}>
        {children}
      </ConfirmContext.Provider>
    </Provider>
  );

  return renderHook(() => usePostQuoteWithdrawTokenFilter(), { wrapper });
}

describe('usePostQuoteWithdrawTokenFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSendTokens.mockReturnValue(ALL_TOKENS_MOCK);
  });

  it('returns passed-in tokens unchanged for non-withdraw transaction types', () => {
    const { result } = renderUsePostQuoteWithdrawTokenFilter({
      type: TransactionType.simpleSend,
    });
    const input = [ALL_TOKENS_MOCK[0]];

    expect(result.current.filterTokens(input)).toBe(input);
    expect(result.current.isFilterApplied).toBe(false);
    expect(result.current.isTokenAllowed('0x1', '0xaaa')).toBe(false);
    expect(mockUseSendTokens).toHaveBeenCalledWith({
      includeNoBalance: false,
      tokenFilter: undefined,
      enrichTokenRequests: [],
    });
  });

  it('returns passed-in tokens unchanged when no allowlist is configured', () => {
    const { result } = renderUsePostQuoteWithdrawTokenFilter({
      postQuoteFlags: {
        perpsWithdraw: { enabled: true },
      },
    });
    const input = [ALL_TOKENS_MOCK[0]];

    expect(result.current.filterTokens(input)).toBe(input);
    expect(result.current.isFilterApplied).toBe(false);
    expect(result.current.isTokenAllowed('0x1', '0xaaa')).toBe(false);
    expect(mockUseSendTokens).toHaveBeenCalledWith({
      includeNoBalance: false,
      tokenFilter: undefined,
      enrichTokenRequests: [],
    });
  });

  it('returns passed-in tokens unchanged when the allowlist is disabled', () => {
    const { result } = renderUsePostQuoteWithdrawTokenFilter({
      postQuoteFlags: {
        perpsWithdraw: {
          enabled: false,
          tokens: { '0x1': ['0xaaa'] },
        },
      },
    });
    const input = [ALL_TOKENS_MOCK[0]];

    expect(result.current.filterTokens(input)).toBe(input);
    expect(result.current.isFilterApplied).toBe(false);
    expect(result.current.isTokenAllowed('0x1', '0xaaa')).toBe(false);
    expect(mockUseSendTokens).toHaveBeenCalledWith({
      includeNoBalance: false,
      tokenFilter: undefined,
      enrichTokenRequests: [],
    });
  });

  it('returns allowlisted wallet tokens for perps withdraw', () => {
    const { result } = renderUsePostQuoteWithdrawTokenFilter({
      postQuoteFlags: {
        perpsWithdraw: {
          enabled: true,
          tokens: { '0x1': ['0xaaa'] },
        },
      },
    });

    expect(result.current.filterTokens([])).toBe(ALL_TOKENS_MOCK);
    expect(result.current.isFilterApplied).toBe(true);
    expect(result.current.isTokenAllowed('0x1', '0xaaa')).toBe(true);
    expect(result.current.isTokenAllowed('0x1', '0xbbb')).toBe(false);
    expect(mockUseSendTokens).toHaveBeenCalledWith({
      includeNoBalance: true,
      tokenFilter: expect.any(Function),
      enrichTokenRequests: [
        {
          address: '0xaaa',
          chainId: '0x1',
        },
      ],
    });
  });

  it('passes a case-insensitive tokenFilter for allowlisted tokens', () => {
    renderUsePostQuoteWithdrawTokenFilter({
      postQuoteFlags: {
        perpsWithdraw: {
          enabled: true,
          tokens: { '0x1': ['0xAAA'] },
        },
      },
    });

    const filter = mockUseSendTokens.mock.calls[0][0]?.tokenFilter;

    expect(filter?.('0x1', '0xaaa')).toBe(true);
    expect(filter?.('0X1', '0xAAA')).toBe(true);
    expect(filter?.('0x1', '0xbbb')).toBe(false);
  });

  it('matches native tokens via zero address without requesting enrichment', () => {
    renderUsePostQuoteWithdrawTokenFilter({
      postQuoteFlags: {
        perpsWithdraw: {
          enabled: true,
          tokens: {
            '0x1': ['0x0000000000000000000000000000000000000000'],
          },
        },
      },
    });

    const args = mockUseSendTokens.mock.calls[0][0];
    const filter = args?.tokenFilter;
    const nativeAddress = getNativeTokenAddress('0x1');

    expect(filter?.('0x1', nativeAddress)).toBe(true);
    expect(args?.enrichTokenRequests).toEqual([]);
  });

  it('uses the matching post-quote withdraw type from nested transactions', () => {
    renderUsePostQuoteWithdrawTokenFilter({
      transactionMeta: {
        id: 'tx-id',
        type: TransactionType.batch,
        txParams: {},
        nestedTransactions: [{ type: TransactionType.perpsWithdraw }],
      } as unknown as TransactionMeta,
      postQuoteFlags: {
        default: {
          enabled: true,
          tokens: { '0x1': ['0xbbb'] },
        },
        overrides: {
          perpsWithdraw: {
            tokens: { '0x1': ['0xaaa'] },
          },
        },
      },
    });

    const filter = mockUseSendTokens.mock.calls[0][0]?.tokenFilter;

    expect(filter?.('0x1', '0xaaa')).toBe(true);
    expect(filter?.('0x1', '0xbbb')).toBe(false);
  });
});
