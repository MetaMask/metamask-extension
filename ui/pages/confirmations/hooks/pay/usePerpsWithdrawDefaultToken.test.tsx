/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import React from 'react';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { ARBITRUM_USDC } from '../../constants/perps';
import { usePerpsWithdrawDefaultToken } from './usePerpsWithdrawDefaultToken';

const mockStore = configureStore([]);

const TOKEN_ADDRESS_1 = '0x1111111111111111111111111111111111111111' as Hex;
const TOKEN_ADDRESS_2 = '0x2222222222222222222222222222222222222222' as Hex;
const TOKEN_ADDRESS_3 = '0x3333333333333333333333333333333333333333' as Hex;
const CHAIN_ID_1 = '0xa4b1' as Hex; // arbitrum
const CHAIN_ID_2 = '0x38' as Hex; // bsc
const CHAIN_ID_3 = '0x1' as Hex; // mainnet

function makeTx(overrides: Partial<TransactionMeta>): TransactionMeta {
  return {
    id: 'tx',
    time: 0,
    status: TransactionStatus.confirmed,
    txParams: {},
    ...overrides,
  } as TransactionMeta;
}

function renderHookWithState({
  remoteFeatureFlags = {},
  transactions,
}: {
  remoteFeatureFlags?: Record<string, unknown>;
  transactions: TransactionMeta[];
}) {
  const store = mockStore({ metamask: { remoteFeatureFlags, transactions } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => usePerpsWithdrawDefaultToken(), { wrapper });
}

describe('usePerpsWithdrawDefaultToken', () => {
  it('falls back to native Arbitrum USDC when there are no transactions', () => {
    const { result } = renderHookWithState({ transactions: [] });

    expect(result.current).toStrictEqual({
      address: ARBITRUM_USDC.address,
      chainId: ARBITRUM_USDC.chainId,
    });
  });

  it('falls back to the feature-flagged Perps Withdraw token when there are no transactions', () => {
    const { result } = renderHookWithState({
      remoteFeatureFlags: {
        confirmations_pay_tokens: {
          preferredTokens: {
            default: {},
            overrides: {
              perpsWithdraw: [
                {
                  address: TOKEN_ADDRESS_3,
                  chainId: CHAIN_ID_3,
                  name: 'mUSD',
                },
              ],
            },
          },
        },
      },
      transactions: [],
    });

    expect(result.current).toStrictEqual({
      address: TOKEN_ADDRESS_3,
      chainId: CHAIN_ID_3,
    });
  });

  it('falls back to native Arbitrum USDC when no confirmed perpsWithdraw exists', () => {
    const { result } = renderHookWithState({
      transactions: [
        makeTx({
          id: 'tx-1',
          time: 100,
          type: TransactionType.simpleSend,
          metamaskPay: { tokenAddress: TOKEN_ADDRESS_1, chainId: CHAIN_ID_1 },
        }),
      ],
    });

    expect(result.current).toStrictEqual({
      address: ARBITRUM_USDC.address,
      chainId: ARBITRUM_USDC.chainId,
    });
  });

  it('returns the metamaskPay token of the latest confirmed direct perpsWithdraw', () => {
    const { result } = renderHookWithState({
      remoteFeatureFlags: {
        confirmations_pay_tokens: {
          preferredTokens: {
            overrides: {
              perpsWithdraw: [
                {
                  address: TOKEN_ADDRESS_3,
                  chainId: CHAIN_ID_3,
                  name: 'mUSD',
                },
              ],
            },
          },
        },
      },
      transactions: [
        makeTx({
          id: 'old',
          time: 100,
          type: TransactionType.perpsWithdraw,
          metamaskPay: { tokenAddress: TOKEN_ADDRESS_1, chainId: CHAIN_ID_1 },
        }),
        makeTx({
          id: 'new',
          time: 200,
          type: TransactionType.perpsWithdraw,
          metamaskPay: { tokenAddress: TOKEN_ADDRESS_2, chainId: CHAIN_ID_2 },
        }),
      ],
    });

    expect(result.current).toStrictEqual({
      address: TOKEN_ADDRESS_2,
      chainId: CHAIN_ID_2,
    });
  });

  it('matches perpsWithdraw declared as a nested transaction inside a batch', () => {
    const { result } = renderHookWithState({
      transactions: [
        makeTx({
          id: 'batch',
          time: 100,
          type: TransactionType.batch,
          nestedTransactions: [
            { type: TransactionType.perpsWithdraw },
          ] as TransactionMeta['nestedTransactions'],
          metamaskPay: { tokenAddress: TOKEN_ADDRESS_1, chainId: CHAIN_ID_1 },
        }),
      ],
    });

    expect(result.current).toStrictEqual({
      address: TOKEN_ADDRESS_1,
      chainId: CHAIN_ID_1,
    });
  });

  it('ignores unconfirmed perpsWithdraw transactions', () => {
    const { result } = renderHookWithState({
      transactions: [
        makeTx({
          id: 'unapproved',
          time: 200,
          status: TransactionStatus.unapproved,
          type: TransactionType.perpsWithdraw,
          metamaskPay: { tokenAddress: TOKEN_ADDRESS_2, chainId: CHAIN_ID_2 },
        }),
        makeTx({
          id: 'confirmed',
          time: 100,
          type: TransactionType.perpsWithdraw,
          metamaskPay: { tokenAddress: TOKEN_ADDRESS_1, chainId: CHAIN_ID_1 },
        }),
      ],
    });

    expect(result.current).toStrictEqual({
      address: TOKEN_ADDRESS_1,
      chainId: CHAIN_ID_1,
    });
  });

  it('ignores perpsWithdraw transactions missing metamaskPay metadata', () => {
    const { result } = renderHookWithState({
      transactions: [
        makeTx({
          id: 'no-pay-meta',
          time: 200,
          type: TransactionType.perpsWithdraw,
        }),
      ],
    });

    expect(result.current).toStrictEqual({
      address: ARBITRUM_USDC.address,
      chainId: ARBITRUM_USDC.chainId,
    });
  });
});
