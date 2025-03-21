import { zeroAddress } from 'ethereumjs-util';
import * as bridgeController from '@metamask/bridge-controller';
import { MultichainNetwork } from '@metamask/multichain-transactions-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import useLatestBalance from './useLatestBalance';

const mockCalcLatestSrcBalance = jest.fn();
jest.mock('@metamask/bridge-controller', () => {
  return {
    ...jest.requireActual('@metamask/bridge-controller'),
    calcLatestSrcBalance: (...args: unknown[]) =>
      mockCalcLatestSrcBalance(...args),
  };
});

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
  });

  it('returns balanceAmount for native asset in current chain', async () => {
    mockCalcLatestSrcBalance.mockResolvedValueOnce('1000000000000000000');

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      { address: zeroAddress(), decimals: 18 },
      CHAIN_IDS.MAINNET,
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toBe('1');

    expect(mockCalcLatestSrcBalance).toHaveBeenCalledTimes(1);
    expect(mockCalcLatestSrcBalance).toHaveBeenCalledWith(
      'https://localhost/rpc/0x1',
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      '0x0000000000000000000000000000000000000000',
    );
  });

  it('returns balanceAmount for ERC20 asset in current chain', async () => {
    mockCalcLatestSrcBalance.mockResolvedValueOnce('15390000');

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
      CHAIN_IDS.MAINNET,
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toStrictEqual('15.39');

    expect(mockCalcLatestSrcBalance).toHaveBeenCalledTimes(1);
    expect(mockCalcLatestSrcBalance).toHaveBeenCalledWith(
      'https://localhost/rpc/0x1',
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    );
  });

  it('returns balance amount for Solana token', async () => {
    const mockStoreState = createBridgeMockStore({
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: 'test-account-id',
          accounts: {
            'test-account-id': {
              id: 'test-account-id',
              type: 'solana',
              address: 'account-address',
            },
          },
        },
        balances: {
          'test-account-id': {
            [bridgeController.getNativeAssetForChainId(
              bridgeController.ChainId.SOLANA,
            ).assetId]: {
              amount: '2',
            },
          },
        },
      },
    });

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      {
        address: bridgeController.getNativeAssetForChainId(
          bridgeController.ChainId.SOLANA,
        ).assetId,
        decimals: 9,
      },
      MultichainNetwork.Solana,
      mockStoreState,
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toBe('2');
  });
});
