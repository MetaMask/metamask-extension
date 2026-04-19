import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useTokenWithBalance } from './useTokenWithBalance';

jest.mock('./useTokenFiatRates', () => ({
  useTokenFiatRate: jest.fn(() => 10000),
}));

const CHAIN_ID = '0x1' as Hex;
const ACCOUNT_ID = 'account-id-1';
const ACCOUNT_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222' as Hex;

function createMockState() {
  return {
    localeMessages: {
      currentLocale: 'en_US',
      current: {},
      en: {},
    },
    metamask: {
      currentCurrency: 'usd',
      selectedCurrency: 'usd',
      internalAccounts: {
        selectedAccount: ACCOUNT_ID,
        accounts: {
          [ACCOUNT_ID]: {
            id: ACCOUNT_ID,
            address: ACCOUNT_ADDRESS,
            type: 'eip155:eoa',
          },
        },
      },
      // Legacy token list used by selectSingleTokenByAddressAndChainId
      allTokens: {
        [CHAIN_ID]: {
          [ACCOUNT_ADDRESS]: [
            {
              address: TOKEN_ADDRESS,
              symbol: 'T1',
              decimals: 4,
              name: 'T1',
              image: '',
            },
          ],
        },
      },
      // Legacy native balance used by getNativeTokenCachedBalanceByChainIdSelector
      accountsByChainId: {
        [CHAIN_ID]: {
          [ACCOUNT_ADDRESS]: {
            balance: '0x1BC16D674EC80000', // 2 ETH
          },
        },
      },
      // Legacy ERC-20 balances used by getTokenBalances
      tokenBalances: {
        [ACCOUNT_ADDRESS]: {
          [CHAIN_ID]: {
            [TOKEN_ADDRESS]: '0x64', // 100 raw units → 0.01 with 4 decimals
          },
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

function runHook(tokenAddress: Hex, chainId: Hex) {
  return renderHookWithProvider(
    () => useTokenWithBalance(tokenAddress, chainId),
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

  it('returns undefined if no token exists for the given address and chain ID', () => {
    const { result } = runHook(
      '0x3333333333333333333333333333333333333333' as Hex,
      CHAIN_ID,
    );

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when unified assets state is enabled', () => {
    const stateWithFlag = {
      ...createMockState(),
      metamask: {
        ...createMockState().metamask,
        remoteFeatureFlags: {
          assetsUnifyState: { enabled: true, featureVersion: '1' },
        },
      },
    };
    const { result } = renderHookWithProvider(
      () => useTokenWithBalance(TOKEN_ADDRESS, CHAIN_ID),
      stateWithFlag,
    );

    expect(result.current).toBeUndefined();
  });
});
