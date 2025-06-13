import { zeroAddress } from 'ethereumjs-util';
import * as bridgeController from '@metamask/bridge-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { SolScope } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { createTestProviderTools } from '../../../test/stub/provider';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  token: { address: string; decimals?: number | string; chainId: any },
  mockStoreState: object,
) =>
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHookWithProvider(() => useLatestBalance(token as any), mockStoreState);

describe('useLatestBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { provider } = createTestProviderTools({
      networkId: 'Ethereum',
      chainId: CHAIN_IDS.MAINNET,
    });

    global.ethereumProvider = provider;
  });

  it('returns balanceAmount for native asset in current chain', async () => {
    mockCalcLatestSrcBalance.mockResolvedValueOnce('1000000000000000000');

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      { address: zeroAddress(), decimals: 18, chainId: CHAIN_IDS.MAINNET },
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toBe('1');

    expect(mockCalcLatestSrcBalance).toHaveBeenCalledTimes(1);
    expect(mockCalcLatestSrcBalance).toHaveBeenCalledWith(
      global.ethereumProvider,
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      '0x0000000000000000000000000000000000000000',
      CHAIN_IDS.MAINNET,
    );
  });

  it('returns balanceAmount for ERC20 asset in current chain', async () => {
    mockCalcLatestSrcBalance.mockResolvedValueOnce('15390000');

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        chainId: CHAIN_IDS.MAINNET,
      },
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toStrictEqual('15.39');

    expect(mockCalcLatestSrcBalance).toHaveBeenCalledTimes(1);
    expect(mockCalcLatestSrcBalance).toHaveBeenCalledWith(
      global.ethereumProvider,
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      CHAIN_IDS.MAINNET,
    );
  });

  it('returns balanceAmount for ERC20 asset in current caip-formatted EVM chain', async () => {
    mockCalcLatestSrcBalance.mockResolvedValueOnce('15390000');

    const { result, waitForNextUpdate } = renderUseLatestBalance(
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        chainId: toEvmCaipChainId(CHAIN_IDS.MAINNET),
      },
      createBridgeMockStore(),
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toStrictEqual('15.39');

    expect(mockCalcLatestSrcBalance).toHaveBeenCalledTimes(1);
    expect(mockCalcLatestSrcBalance).toHaveBeenCalledWith(
      global.ethereumProvider,
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      CHAIN_IDS.MAINNET,
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
              address: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8K',
              scopes: [SolScope.Mainnet],
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
          MultichainNetworks.SOLANA,
        ).assetId,
        decimals: 9,
        chainId: MultichainNetworks.SOLANA,
      },
      mockStoreState,
    );

    await waitForNextUpdate();
    expect(result.current?.toString()).toBe('2');
  });
});
