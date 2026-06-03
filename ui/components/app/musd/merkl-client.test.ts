import {
  fetchMerklRewards,
  fetchMerklRewardsForAsset,
  getClaimedAmountFromContract,
  clearRewardCache,
} from './merkl-client';
import {
  MERKL_API_BASE_URL,
  MUSD_TOKEN_ADDRESS,
  AGLAMERKL_ADDRESS_MAINNET,
  AGLAMERKL_ADDRESS_LINEA,
} from './constants';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock FEATURED_RPCS to provide a resolved Infura URL (partial mock to keep CHAIN_IDS etc.)
jest.mock('../../../../shared/constants/network', () => ({
  ...jest.requireActual('../../../../shared/constants/network'),
  FEATURED_RPCS: [
    {
      chainId: '0xe708',
      rpcEndpoints: [{ url: 'https://linea-mainnet.infura.io/v3/test-key' }],
    },
  ],
}));

const MOCK_USER_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_CHAIN_ID = '0x1'; // Mainnet

const createMockRewardData = (overrides: Record<string, unknown> = {}) => [
  {
    rewards: [
      {
        token: {
          address: MUSD_TOKEN_ADDRESS,
          chainId: 59144,
          symbol: 'MUSD',
          decimals: 6,
          price: 1.0,
        },
        pending: '0',
        proofs: ['0xproof1', '0xproof2'],
        amount: '1000000',
        claimed: '500000',
        recipient: MOCK_USER_ADDRESS,
        ...overrides,
      },
    ],
  },
];

describe('merkl-client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRewardCache();
  });

  describe('fetchMerklRewards', () => {
    it('fetches rewards from the Merkl API', async () => {
      const mockData = createMockRewardData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${MERKL_API_BASE_URL}/users/${MOCK_USER_ADDRESS}/rewards?chainId=1`,
        { signal: undefined },
      );
      expect(result).toStrictEqual(mockData[0].rewards[0]);
    });

    it('supports multiple chain IDs', async () => {
      const mockData = createMockRewardData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: ['0x1', '0xe708'] as `0x${string}`[],
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${MERKL_API_BASE_URL}/users/${MOCK_USER_ADDRESS}/rewards?chainId=1,59144`,
        { signal: undefined },
      );
    });

    it('adds test=true for test tokens (mainnet)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: AGLAMERKL_ADDRESS_MAINNET as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('&test=true'),
        expect.anything(),
      );
    });

    it('adds test=true for test tokens (Linea)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: '0xe708' as `0x${string}`,
        tokenAddress: AGLAMERKL_ADDRESS_LINEA as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('&test=true'),
        expect.anything(),
      );
    });

    it('does not add test=true for mUSD token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.stringContaining('&test=true'),
        expect.anything(),
      );
    });

    it('throws when API returns non-ok status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(
        fetchMerklRewards({
          userAddress: MOCK_USER_ADDRESS,
          chainIds: MOCK_CHAIN_ID as `0x${string}`,
          tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
        }),
      ).rejects.toThrow('Failed to fetch Merkl rewards: 500');
    });

    it('returns null when no matching reward is found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      const result = await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(result).toBeNull();
    });

    it('matches token address case-insensitively', async () => {
      const mockData = createMockRewardData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS.toUpperCase() as `0x${string}`,
      });

      expect(result).toStrictEqual(mockData[0].rewards[0]);
    });

    it('searches across multiple data entries', async () => {
      const mockData = [
        { rewards: [] },
        {
          rewards: [
            {
              token: {
                address: MUSD_TOKEN_ADDRESS,
                chainId: 59144,
                symbol: 'MUSD',
                decimals: 6,
                price: 1.0,
              },
              pending: '0',
              proofs: [],
              amount: '100',
              claimed: '0',
              recipient: MOCK_USER_ADDRESS,
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(result).toStrictEqual(mockData[1].rewards[0]);
    });

    it('converts hex chain ID 0xe708 to decimal 59144 in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: '0xe708' as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chainId=59144'),
        expect.anything(),
      );
    });

    it('converts hex chain ID 0x1 to decimal 1 in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: '0x1' as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chainId=1'),
        expect.anything(),
      );
    });

    it('converts multiple hex chain IDs to comma-separated decimals', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: ['0x1', '0xe708', '0xe709'] as `0x${string}`[],
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
      });

      // 0x1=1, 0xe708=59144, 0xe709 corrected to 59144
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chainId=1,59144,59145'),
        expect.anything(),
      );
    });

    it('passes abort signal to fetch', async () => {
      const abortController = new AbortController();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewards({
        userAddress: MOCK_USER_ADDRESS,
        chainIds: MOCK_CHAIN_ID as `0x${string}`,
        tokenAddress: MUSD_TOKEN_ADDRESS as `0x${string}`,
        signal: abortController.signal,
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        signal: abortController.signal,
      });
    });
  });

  describe('fetchMerklRewardsForAsset', () => {
    it('fetches from Linea for mUSD tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewardsForAsset(
        MUSD_TOKEN_ADDRESS,
        '0x1' as `0x${string}`,
        MOCK_USER_ADDRESS,
      );

      // Should query Linea chainId (59144) for mUSD
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chainId=59144'),
        expect.anything(),
      );
    });

    it('fetches from the token chain for non-mUSD tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ rewards: [] }]),
      });

      await fetchMerklRewardsForAsset(
        AGLAMERKL_ADDRESS_MAINNET,
        '0x1' as `0x${string}`,
        MOCK_USER_ADDRESS,
      );

      // Should query mainnet chainId (1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chainId=1'),
        expect.anything(),
      );
    });

    it('uses MUSD_TOKEN_ADDRESS for mUSD token matching', async () => {
      const mockData = createMockRewardData();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchMerklRewardsForAsset(
        MUSD_TOKEN_ADDRESS,
        '0x1' as `0x${string}`,
        MOCK_USER_ADDRESS,
      );

      expect(result).toStrictEqual(mockData[0].rewards[0]);
    });
  });

  describe('getClaimedAmountFromContract', () => {
    const MOCK_TOKEN_ADDRESS = MUSD_TOKEN_ADDRESS as `0x${string}`;

    it('makes a JSON-RPC eth_call and returns the claimed amount', async () => {
      // Encoded (uint208 amount = 500000, uint48 timestamp, bytes32 merkleRoot)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result:
            '0x000000000000000000000000000000000000000000000000000000000007a12000000000000000000000000000000000000000000000000000000000659e36000000000000000000000000000000000000000000000000000000000000000001',
        }),
      });

      const result = await getClaimedAmountFromContract(
        MOCK_USER_ADDRESS,
        MOCK_TOKEN_ADDRESS,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://linea-mainnet.infura.io/v3/test-key',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Infura-Source': 'metamask/metamask',
          }),
        }),
      );

      expect(result).toBe('500000');
    });

    it('returns null when RPC returns empty result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: '0x' }),
      });

      const result = await getClaimedAmountFromContract(
        MOCK_USER_ADDRESS,
        MOCK_TOKEN_ADDRESS,
      );

      expect(result).toBeNull();
    });

    it('returns null when fetch response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await getClaimedAmountFromContract(
        MOCK_USER_ADDRESS,
        MOCK_TOKEN_ADDRESS,
      );

      expect(result).toBeNull();
    });

    it('returns null when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await getClaimedAmountFromContract(
        MOCK_USER_ADDRESS,
        MOCK_TOKEN_ADDRESS,
      );

      expect(result).toBeNull();
    });

    it('returns claimed amount of 0 when contract returns zero', async () => {
      // amount = 0, timestamp = 0, merkleRoot = 0x0
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result:
            '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        }),
      });

      const result = await getClaimedAmountFromContract(
        MOCK_USER_ADDRESS,
        MOCK_TOKEN_ADDRESS,
      );

      expect(result).toBe('0');
    });

    it('returns null when RPC returns JSON-RPC error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: { message: 'execution reverted' } }),
      });

      const result = await getClaimedAmountFromContract(
        MOCK_USER_ADDRESS,
        MOCK_TOKEN_ADDRESS,
      );

      expect(result).toBeNull();
    });
  });
});
