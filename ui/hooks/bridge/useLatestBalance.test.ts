import { BigNumber } from 'ethers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { zeroAddress } from '../../__mocks__/ethereumjs-util';
import { createTestProviderTools } from '../../../test/stub/provider';
import * as tokenutil from '../../../shared/lib/token-util';
import useLatestBalance from './useLatestBalance';

const mockGetBalance = jest.fn();
jest.mock('@ethersproject/providers', () => {
  return {
    Web3Provider: jest.fn().mockImplementation(() => {
      return {
        getBalance: mockGetBalance,
      };
    }),
  };
});

const mockFetchTokenBalance = jest.spyOn(tokenutil, 'fetchTokenBalance');
jest.mock('../../../shared/lib/token-util', () => ({
  ...jest.requireActual('../../../shared/lib/token-util'),
  fetchTokenBalance: jest.fn(),
}));

const renderUseLatestBalance = (
  token: { address: string; decimals?: number | string },
  chainId: string,
  mockStoreState: object,
) =>
  renderHookWithProvider(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => useLatestBalance(token as any, chainId as any),
    mockStoreState,
  );

describe('useLatestBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { provider } = createTestProviderTools({
      networkId: 'Ethereum',
      chainId: CHAIN_IDS.MAINNET,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.ethereumProvider = provider as any;
  });

  it('returns formattedBalance for native asset in current chain', async () => {
    mockGetBalance.mockResolvedValue(BigNumber.from('1000000000000000000'));

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      { address: zeroAddress(), decimals: 18 },
      CHAIN_IDS.MAINNET,
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current.formattedBalance).toStrictEqual('1');

    expect(mockGetBalance).toHaveBeenCalledTimes(1);
    expect(mockGetBalance).toHaveBeenCalledWith(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(mockFetchTokenBalance).toHaveBeenCalledTimes(0);
  });

  it('returns formattedBalance for ERC20 asset in current chain', async () => {
    mockFetchTokenBalance.mockResolvedValueOnce(BigNumber.from('15390000'));

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: '6' },
      CHAIN_IDS.MAINNET,
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current.formattedBalance).toStrictEqual('15.39');

    expect(mockFetchTokenBalance).toHaveBeenCalledTimes(1);
    expect(mockFetchTokenBalance).toHaveBeenCalledWith(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      global.ethereumProvider,
    );
    expect(mockGetBalance).toHaveBeenCalledTimes(0);
  });
});
