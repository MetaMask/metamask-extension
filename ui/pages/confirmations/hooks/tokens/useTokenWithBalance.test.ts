import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTokenWithBalance } from './useTokenWithBalance';

/**
 * This suite seeds AssetsController fields (`assetsInfo`, `assetsBalance`,
 * `assetsPrice`). Override the global jest setup mock so migration
 * selectors resolve those fields instead of legacy controller slices.
 */
jest.mock(
  '../../../../../shared/lib/assets-unify-state/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../../shared/lib/assets-unify-state/remote-feature-flag',
    ),
    isAssetsUnifyStateFeatureEnabled: () => true,
  }),
);

const CHAIN_ID = '0x1' as Hex;
const ACCOUNT_ID = 'account-id-1';
const OTHER_ACCOUNT_ID = 'account-id-2';
const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const OTHER_ACCOUNT_ADDRESS =
  '0x4444444444444444444444444444444444444444' as Hex;
const TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222' as Hex;
const NATIVE_ASSET_ID = 'eip155:1/slip44:60';
const TOKEN_ASSET_ID = `eip155:1/erc20:${TOKEN_ADDRESS}`;

function createMockState() {
  return {
    localeMessages: {
      currentLocale: 'en_US',
      current: {},
      en: {},
    },
    metamask: {
      selectedCurrency: 'usd',
      internalAccounts: {
        selectedAccount: ACCOUNT_ID,
        accounts: {
          [ACCOUNT_ID]: {
            id: ACCOUNT_ID,
            address: ACCOUNT_ADDRESS,
            type: 'eip155:eoa',
          },
          [OTHER_ACCOUNT_ID]: {
            id: OTHER_ACCOUNT_ID,
            address: OTHER_ACCOUNT_ADDRESS,
            type: 'eip155:eoa',
          },
        },
      },
      assetsInfo: {
        [NATIVE_ASSET_ID]: {
          type: 'native',
          decimals: 18,
          symbol: 'ETH',
        },
        [TOKEN_ASSET_ID]: {
          type: 'erc20',
          symbol: 'T1',
          decimals: 4,
          image: '',
        },
      },
      assetsBalance: {
        [ACCOUNT_ID]: {
          [NATIVE_ASSET_ID]: { amount: '2' },
          // 0x64 at 4 decimals → 0.01
          [TOKEN_ASSET_ID]: { amount: '0.01' },
        },
        [OTHER_ACCOUNT_ID]: {
          [NATIVE_ASSET_ID]: { amount: '1' },
          // 0xc8 at 4 decimals → 0.02
          [TOKEN_ASSET_ID]: { amount: '0.02' },
        },
      },
      assetsPrice: {
        [NATIVE_ASSET_ID]: {
          assetPriceType: 'fungible',
          price: 10000,
          usdPrice: 10000,
          lastUpdated: 1,
        },
        // marketData price is in native units; store price * nativeConversionRate
        [TOKEN_ASSET_ID]: {
          assetPriceType: 'fungible',
          price: 1 * 10000,
          usdPrice: 1 * 10000,
          lastUpdated: 1,
        },
      },
      networkConfigurationsByChainId: {
        [CHAIN_ID]: {
          chainId: CHAIN_ID,
          nativeCurrency: 'ETH',
          name: 'Ethereum',
          rpcEndpoints: [{ networkClientId: 'mainnet' }],
          defaultRpcEndpointIndex: 0,
        },
      },
    },
  };
}

function runHook(tokenAddress: Hex, chainId: Hex, accountAddress?: Hex) {
  return renderHookWithProvider(
    () => useTokenWithBalance(tokenAddress, chainId, accountAddress),
    createMockState(),
  );
}

describe('useTokenWithBalance', () => {
  it('returns token and balance properties', () => {
    const { result } = runHook(TOKEN_ADDRESS, CHAIN_ID);

    expect(result.current).toMatchObject({
      address: TOKEN_ADDRESS,
      balance: '0.01',
      balanceRaw: '100',
      chainId: CHAIN_ID,
      decimals: 4,
      symbol: 'T1',
      tokenFiatAmount: 100,
    });

    expect(result.current?.balanceFiat).toContain('100');
  });

  it('returns native token properties', () => {
    const nativeTokenAddress = getNativeTokenAddress(CHAIN_ID);
    const { result } = runHook(nativeTokenAddress, CHAIN_ID);

    expect(result.current).toMatchObject({
      address: nativeTokenAddress,
      balance: '2',
      balanceRaw: '2000000000000000000',
      chainId: CHAIN_ID,
      decimals: 18,
      symbol: 'ETH',
      tokenFiatAmount: 20000,
    });

    expect(result.current?.balanceFiat).toContain('20,000');
  });

  it('reads the token balance of an explicit account', () => {
    const { result } = runHook(TOKEN_ADDRESS, CHAIN_ID, OTHER_ACCOUNT_ADDRESS);

    expect(result.current).toMatchObject({
      balance: '0.02',
      balanceRaw: '200',
    });
  });

  it('reads the native balance of an explicit account', () => {
    const nativeTokenAddress = getNativeTokenAddress(CHAIN_ID);
    const { result } = runHook(
      nativeTokenAddress,
      CHAIN_ID,
      OTHER_ACCOUNT_ADDRESS,
    );

    expect(result.current).toMatchObject({
      balance: '1',
      balanceRaw: '1000000000000000000',
    });
  });

  it('returns undefined if no token exists for the given address and chain ID', () => {
    const { result } = runHook(
      '0x3333333333333333333333333333333333333333' as Hex,
      CHAIN_ID,
    );

    expect(result.current).toBeUndefined();
  });
});
