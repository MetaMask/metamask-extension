import { renderHook } from '@testing-library/react-hooks';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import * as transactionPayUtils from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { Asset, AssetStandard } from '../../types/send';
import type { TransactionPayAsset } from './types';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

jest.mock('../send/useSendTokens');
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

const TOKEN_MOCK: TransactionPayAsset = {
  ...SEND_TOKEN_MOCK,
  disabled: false,
  isSelected: false,
};

describe('useTransactionPayAvailableTokens', () => {
  const useSendTokensMock = jest.mocked(useSendTokens);
  const getAvailableTokensMock = jest.mocked(
    transactionPayUtils.getAvailableTokens,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    useSendTokensMock.mockReturnValue([SEND_TOKEN_MOCK]);
    getAvailableTokensMock.mockReturnValue([TOKEN_MOCK]);
  });

  it('returns available tokens', () => {
    const { result } = renderHook(() => useTransactionPayAvailableTokens());

    expect(result.current).toMatchObject([TOKEN_MOCK]);
  });

  it('calls getAvailableTokens with tokens from useSendTokens', () => {
    renderHook(() => useTransactionPayAvailableTokens());

    expect(getAvailableTokensMock).toHaveBeenCalledWith({
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
