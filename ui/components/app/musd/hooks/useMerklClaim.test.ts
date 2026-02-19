import { renderHook, act } from '@testing-library/react-hooks';
import { Interface } from '@ethersproject/abi';
import * as merklClient from '../merkl-client';
import { DISTRIBUTOR_CLAIM_ABI, MERKL_DISTRIBUTOR_ADDRESS } from '../constants';
import { useMerklClaim } from './useMerklClaim';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  addTransactionAndRouteToConfirmationPage: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../merkl-client');

const { useSelector, useDispatch } = jest.requireMock('react-redux');
const {
  addTransactionAndRouteToConfirmationPage,
  findNetworkClientIdByChainId,
} = jest.requireMock('../../../../store/actions');

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const MOCK_NETWORK_CLIENT_ID = 'linea-mainnet';

const MOCK_PROOF_1 =
  '0x0000000000000000000000000000000000000000000000000000000000000001';
const MOCK_PROOF_2 =
  '0x0000000000000000000000000000000000000000000000000000000000000002';

const mockRewardData = {
  token: {
    address: MOCK_TOKEN_ADDRESS,
    chainId: 59144,
    symbol: 'MUSD',
    decimals: 6,
    price: 1.0,
  },
  pending: '0',
  proofs: [MOCK_PROOF_1, MOCK_PROOF_2],
  amount: '1000000',
  claimed: '0',
  recipient: MOCK_ADDRESS,
};

describe('useMerklClaim', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useSelector.mockImplementation(() => ({ address: MOCK_ADDRESS }));
    useDispatch.mockReturnValue(mockDispatch);

    findNetworkClientIdByChainId.mockResolvedValue(MOCK_NETWORK_CLIENT_ID);
    addTransactionAndRouteToConfirmationPage.mockReturnValue(
      jest.fn().mockResolvedValue(null),
    );

    (merklClient.fetchMerklRewardsForAsset as jest.Mock).mockResolvedValue(
      mockRewardData,
    );
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    expect(result.current.isClaiming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.claimRewards).toBe('function');
  });

  it('fetches reward data and creates transaction', async () => {
    mockDispatch.mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    // Verify API was called
    expect(merklClient.fetchMerklRewardsForAsset).toHaveBeenCalledWith(
      MOCK_TOKEN_ADDRESS,
      '0x1',
      MOCK_ADDRESS,
      expect.any(AbortSignal),
    );

    // Verify transaction was dispatched
    expect(mockDispatch).toHaveBeenCalled();
    expect(addTransactionAndRouteToConfirmationPage).toHaveBeenCalled();

    // Verify transaction params
    const callArgs = addTransactionAndRouteToConfirmationPage.mock.calls[0];
    const txParams = callArgs[0];
    expect(txParams.from).toBe(MOCK_ADDRESS);
    expect(txParams.to).toBe(MERKL_DISTRIBUTOR_ADDRESS);
    expect(txParams.value).toBe('0x0');

    // Verify encoded data contains claim function signature
    const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
    const expectedData = iface.encodeFunctionData('claim', [
      [MOCK_ADDRESS],
      [mockRewardData.token.address],
      [mockRewardData.amount],
      [mockRewardData.proofs],
    ]);
    expect(txParams.data).toBe(expectedData);
  });

  it('sets error when no account is selected', async () => {
    useSelector.mockImplementation(() => ({ address: undefined }));

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(result.current.error).toBe('No account selected');
    expect(result.current.isClaiming).toBe(false);
  });

  it('sets error when no claimable rewards found', async () => {
    (merklClient.fetchMerklRewardsForAsset as jest.Mock).mockResolvedValue(
      null,
    );

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(result.current.error).toBe('No claimable rewards found');
    expect(result.current.isClaiming).toBe(false);
  });

  it('keeps isClaiming true after successful claim (component unmounts on navigation)', async () => {
    mockDispatch.mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    // isClaiming stays true because the user is redirected to the confirmation page
    // and the component unmounts, so there's no need to reset it
    expect(result.current.isClaiming).toBe(true);
  });

  it('aborts previous request when claiming again', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    mockDispatch.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    // Call claimRewards twice sequentially - second call should abort the first
    await act(async () => {
      await result.current.claimRewards();
    });

    await act(async () => {
      await result.current.claimRewards();
    });

    // abort should have been called (previous request aborted)
    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('uses correct network client for Linea', async () => {
    mockDispatch.mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(findNetworkClientIdByChainId).toHaveBeenCalled();
  });
});
