import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../shared/constants/swaps';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { useTokensWithFiltering } from './useTokensWithFiltering';

const mockUseTokenTracker = jest
  .fn()
  .mockReturnValue({ tokensWithBalances: [] });
jest.mock('../useTokenTracker', () => ({
  useTokenTracker: () => mockUseTokenTracker(),
}));

const NATIVE_TOKEN = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];

describe('useTokensWithFiltering', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return tokens that are not in the allowlist', () => {
    const mockStore = createBridgeMockStore({
      metamaskStateOverrides: {
        completedOnboarding: true,
        allDetectedTokens: {
          '0x1': {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [
              {
                address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                decimals: 6,
              }, // USDC
            ],
          },
        },
      },
    });
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering(
          {
            [NATIVE_TOKEN.address]: NATIVE_TOKEN,
            ...STATIC_MAINNET_TOKEN_LIST,
          },
          [
            { address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' }, // UNI
            { address: NATIVE_TOKEN.address },
            { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' }, // USDC
            { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT
          ],
          CHAIN_IDS.MAINNET,
        ),
      mockStore,
    );
    // The first 5 tokens returned
    const first5Tokens = [...result.current(() => true)].slice(0, 5);
    expect(first5Tokens).toMatchSnapshot();
  });
});
