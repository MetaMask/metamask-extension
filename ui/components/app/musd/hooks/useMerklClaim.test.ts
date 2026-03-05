import { renderHook, act } from '@testing-library/react-hooks';
import { Interface } from '@ethersproject/abi';
import * as merklClient from '../merkl-client';
import { DISTRIBUTOR_CLAIM_ABI, MERKL_DISTRIBUTOR_ADDRESS } from '../constants';
import { useMerklClaim } from './useMerklClaim';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/asset/0x1/0xtest', search: '' }),
}));

const mockAddTransaction = jest.fn();
const mockFindNetworkClientIdByChainId = jest.fn();

jest.mock('../../../../store/actions', () => ({
  addTransaction: (...args: unknown[]) => mockAddTransaction(...args),
  findNetworkClientIdByChainId: (...args: unknown[]) =>
    mockFindNetworkClientIdByChainId(...args),
}));

jest.mock('../merkl-client');

jest.mock('../../../../hooks/musd/useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: jest.fn(() => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
  })),
}));

const { useSelector } = jest.requireMock('react-redux');
const { useMusdGeoBlocking } = jest.requireMock(
  '../../../../hooks/musd/useMusdGeoBlocking',
);

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const MOCK_NETWORK_CLIENT_ID = 'linea-mainnet';
const MOCK_TX_ID = 'claim-tx-123';

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
  beforeEach(() => {
    jest.clearAllMocks();

    useSelector.mockImplementation(() => ({ address: MOCK_ADDRESS }));

    mockFindNetworkClientIdByChainId.mockResolvedValue(MOCK_NETWORK_CLIENT_ID);
    mockAddTransaction.mockResolvedValue({ id: MOCK_TX_ID });

    (merklClient.fetchMerklRewardsForAsset as jest.Mock).mockResolvedValue(
      mockRewardData,
    );

    useMusdGeoBlocking.mockReturnValue({
      isBlocked: false,
      userCountry: 'US',
      isLoading: false,
    });
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
    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(merklClient.fetchMerklRewardsForAsset).toHaveBeenCalledWith(
      MOCK_TOKEN_ADDRESS,
      '0x1',
      MOCK_ADDRESS,
      expect.any(AbortSignal),
    );

    expect(mockAddTransaction).toHaveBeenCalled();

    const callArgs = mockAddTransaction.mock.calls[0];
    const txParams = callArgs[0];
    expect(txParams.from).toBe(MOCK_ADDRESS);
    expect(txParams.to).toBe(MERKL_DISTRIBUTOR_ADDRESS);
    expect(txParams.value).toBe('0x0');

    const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
    const expectedData = iface.encodeFunctionData('claim', [
      [MOCK_ADDRESS],
      [mockRewardData.token.address],
      [mockRewardData.amount],
      [mockRewardData.proofs],
    ]);
    expect(txParams.data).toBe(expectedData);
  });

  it('navigates to confirmation page with returnTo param', async () => {
    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: `/confirm-transaction/${MOCK_TX_ID}`,
      search: 'returnTo=%2Fasset%2F0x1%2F0xtest',
    });
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
    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(result.current.isClaiming).toBe(true);
  });

  it('aborts previous request when claiming again', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('does not dispatch transaction when user is geoblocked', async () => {
    useMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      userCountry: 'GB',
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(merklClient.fetchMerklRewardsForAsset).not.toHaveBeenCalled();
    expect(mockAddTransaction).not.toHaveBeenCalled();
  });

  it('uses correct network client for Linea', async () => {
    const { result } = renderHook(() =>
      useMerklClaim({
        tokenAddress: MOCK_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    await act(async () => {
      await result.current.claimRewards();
    });

    expect(mockFindNetworkClientIdByChainId).toHaveBeenCalled();
  });
});
