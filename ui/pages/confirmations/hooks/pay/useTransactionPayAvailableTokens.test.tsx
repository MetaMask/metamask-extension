import { renderHook } from '@testing-library/react-hooks';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type {
  TransactionPaymentToken,
  TransactionPayRequiredToken,
} from '@metamask/transaction-pay-controller';
import * as transactionPayUtils from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { Asset, AssetStandard } from '../../types/send';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

jest.mock('../send/useSendTokens');
jest.mock('./useTransactionPayData');
jest.mock('./useTransactionPayToken');
jest.mock('../../utils/transaction-pay', () => ({
  ...jest.requireActual('../../utils/transaction-pay'),
  getAvailableTokens: jest.fn(),
}));

const NATIVE_TOKEN_ADDRESS = getNativeTokenAddress('0x1');

function createMockPaymentToken(
  overrides: Partial<TransactionPaymentToken> = {},
): TransactionPaymentToken {
  return {
    address: NATIVE_TOKEN_ADDRESS,
    chainId: '0x123',
    balanceFiat: '100.00',
    balanceHuman: '50',
    balanceRaw: '50000000000000000000',
    balanceUsd: '100.00',
    decimals: 18,
    symbol: 'ETH',
    ...overrides,
  };
}

function createMockRequiredToken(
  overrides: Partial<TransactionPayRequiredToken> = {},
): TransactionPayRequiredToken {
  return {
    address: NATIVE_TOKEN_ADDRESS,
    chainId: '0x123',
    allowUnderMinimum: false,
    amountFiat: '10.00',
    amountHuman: '5',
    amountRaw: '5000000000000000000',
    amountUsd: '10.00',
    balanceFiat: '100.00',
    balanceHuman: '50',
    balanceRaw: '50000000000000000000',
    balanceUsd: '100.00',
    decimals: 18,
    skipIfBalance: false,
    symbol: 'ETH',
    ...overrides,
  };
}

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

describe('useTransactionPayAvailableTokens', () => {
  const useSendTokensMock = jest.mocked(useSendTokens);
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useTransactionPayRequiredTokensMock = jest.mocked(
    useTransactionPayRequiredTokens,
  );
  const getAvailableTokensMock = jest.mocked(
    transactionPayUtils.getAvailableTokens,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useSendTokensMock.mockReturnValue([SEND_TOKEN_MOCK]);
    useTransactionPayTokenMock.mockReturnValue({
      isNative: false,
      payToken: undefined,
      setPayToken: jest.fn(),
    });
    useTransactionPayRequiredTokensMock.mockReturnValue([]);
    getAvailableTokensMock.mockReturnValue([TOKEN_MOCK]);
  });

  it('returns available tokens', () => {
    const { result } = renderHook(() => useTransactionPayAvailableTokens());

    expect(result.current).toMatchObject([TOKEN_MOCK]);
  });

  it('calls getAvailableTokens with tokens and transaction pay context', () => {
    const payToken = createMockPaymentToken();
    const requiredToken = createMockRequiredToken({ skipIfBalance: false });

    useTransactionPayTokenMock.mockReturnValue({
      isNative: true,
      payToken,
      setPayToken: jest.fn(),
    });
    useTransactionPayRequiredTokensMock.mockReturnValue([requiredToken]);

    renderHook(() => useTransactionPayAvailableTokens());

    expect(getAvailableTokensMock).toHaveBeenCalledWith({
      payToken,
      requiredTokens: [requiredToken],
      tokens: expect.arrayContaining([
        expect.objectContaining({
          address: NATIVE_TOKEN_ADDRESS,
          symbol: 'NTV1',
          chainId: '0x123',
        }),
      ]),
    });
  });

  it('returns empty array when no tokens available', () => {
    useSendTokensMock.mockReturnValue([]);
    getAvailableTokensMock.mockReturnValue([]);

    const { result } = renderHook(() => useTransactionPayAvailableTokens());

    expect(result.current).toEqual([]);
  });
});
