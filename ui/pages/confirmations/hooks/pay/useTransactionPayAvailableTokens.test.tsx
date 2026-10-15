import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { SolScope } from '@metamask/keyring-api';
import { ConfirmContext } from '../../context/confirm';
import * as transactionPayUtils from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { Asset, AssetStandard } from '../../types/send';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

jest.mock('../send/useSendTokens');
jest.mock('./useTransactionPayBlockedTokens');
jest.mock('./useTransactionPayToken');
jest.mock('../../utils/transaction-pay', () => ({
  ...jest.requireActual('../../utils/transaction-pay'),
  getAvailableTokens: jest.fn(),
}));

const NATIVE_TOKEN_ADDRESS = getNativeTokenAddress('0x1');

const SEND_TOKEN_MOCK: Asset = {
  accountType: 'eip155:eoa',
  address: NATIVE_TOKEN_ADDRESS,
  balance: '1.23',
  chainId: '0x123',
  decimals: 18,
  name: 'Native Token 1',
  symbol: 'NTV1',
  standard: AssetStandard.ERC20,
  fiat: { balance: 1.23 },
};

const TOKEN_MOCK: Asset = {
  ...SEND_TOKEN_MOCK,
  disabled: false,
  isSelected: false,
};

const TRANSACTION_ID_MOCK = 'tx-1';

const mockStore = configureStore([]);

function createWrapper(metamaskPay?: TransactionMeta['metamaskPay']) {
  const store = mockStore({
    metamask: {
      transactions: [{ id: TRANSACTION_ID_MOCK, metamaskPay, time: 0 }],
      transactionData: {},
      remoteFeatureFlags: {},
    },
  });

  const confirmContextValue = {
    currentConfirmation: { id: TRANSACTION_ID_MOCK },
  };

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ConfirmContext.Provider value={confirmContextValue as never}>
        {children}
      </ConfirmContext.Provider>
    </Provider>
  );
}

describe('useTransactionPayAvailableTokens', () => {
  const useSendTokensMock = jest.mocked(useSendTokens);
  const useTransactionPayBlockedTokensMock = jest.mocked(
    useTransactionPayBlockedTokens,
  );
  const getAvailableTokensMock = jest.mocked(
    transactionPayUtils.getAvailableTokens,
  );
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);

  const blockedTokensMock = {
    chainIds: ['0xa4b1'],
    tokens: [],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    useSendTokensMock.mockReturnValue([SEND_TOKEN_MOCK]);
    useTransactionPayBlockedTokensMock.mockReturnValue(blockedTokensMock);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
    });
    getAvailableTokensMock.mockReturnValue([TOKEN_MOCK]);
  });

  it('returns available tokens', () => {
    const { result } = renderHook(() => useTransactionPayAvailableTokens(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toMatchObject([TOKEN_MOCK]);
  });

  it('calls getAvailableTokens with tokens and LD blocked tokens', () => {
    renderHook(() => useTransactionPayAvailableTokens(), {
      wrapper: createWrapper(),
    });

    expect(getAvailableTokensMock).toHaveBeenCalledWith({
      tokens: expect.arrayContaining([
        expect.objectContaining({
          address: NATIVE_TOKEN_ADDRESS,
          symbol: 'NTV1',
          chainId: '0x123',
        }),
      ]),
      blockedTokens: blockedTokensMock,
      isSolanaPayEnabled: false,
      payToken: undefined,
      paySource: undefined,
    });
  });

  it('passes the persisted pay source to getAvailableTokens', () => {
    const source = {
      sourceAccountId: `${SolScope.Mainnet}:solana-address`,
      sourceAssetId: `${SolScope.Mainnet}/slip44:501`,
    } as const;

    renderHook(() => useTransactionPayAvailableTokens(), {
      wrapper: createWrapper({ source } as TransactionMeta['metamaskPay']),
    });

    expect(getAvailableTokensMock).toHaveBeenCalledWith(
      expect.objectContaining({ paySource: source }),
    );
  });

  it('returns empty array when no tokens available', () => {
    useSendTokensMock.mockReturnValue([]);
    getAvailableTokensMock.mockReturnValue([]);

    const { result } = renderHook(() => useTransactionPayAvailableTokens(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toEqual([]);
  });
});
