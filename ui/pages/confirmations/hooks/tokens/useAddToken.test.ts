import { act } from '@testing-library/react';
import { merge } from 'lodash';
import { EthAccountType } from '@metamask/keyring-api';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../../store/actions';
import { isAssetsUnifyStateFeatureEnabled } from '../../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { useAddToken } from './useAddToken';

jest.mock('../../../../store/actions', () => ({
  addToken: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

// `test/jest/setup.js` forces this to `false` for every unit test. Re-mock it
// here so the unified assets state path can be exercised.
jest.mock(
  '../../../../../shared/lib/assets-unify-state/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../../shared/lib/assets-unify-state/remote-feature-flag',
    ),
    isAssetsUnifyStateFeatureEnabled: jest.fn(() => false),
  }),
);

const TOKEN_ADDRESS_MOCK =
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const;
const CHAIN_ID_MOCK = '0xa4b1' as const;
const ASSET_ID_MOCK = `eip155:42161/erc20:${TOKEN_ADDRESS_MOCK}` as const;
const NATIVE_ASSET_ID_MOCK = 'eip155:42161/slip44:60' as const;
const NETWORK_CLIENT_ID_MOCK = 'mockNetworkClientId';
const SYMBOL_MOCK = 'USDC';
const DECIMALS_MOCK = 6;
const ACCOUNT_ID_MOCK = 'account-1';
const ACCOUNT_ADDRESS_MOCK = '0xAccountAddress';

const FUNGIBLE_PRICE_MOCK = {
  assetPriceType: 'fungible',
  price: 1,
  lastUpdated: 1,
};

const NATIVE_FUNGIBLE_PRICE_MOCK = {
  assetPriceType: 'fungible',
  price: 3000,
  lastUpdated: 1,
};

const MOCK_STATE = {
  metamask: {
    internalAccounts: {
      selectedAccount: ACCOUNT_ID_MOCK,
      accounts: {
        [ACCOUNT_ID_MOCK]: {
          id: ACCOUNT_ID_MOCK,
          address: ACCOUNT_ADDRESS_MOCK,
          type: EthAccountType.Eoa,
          metadata: { name: 'Account 1' },
        },
      },
    },
  },
};

// State shape the unified assets selectors read the token from, standing in for
// a token that was already added by an earlier visit to the confirmation.
const UNIFIED_TOKEN_STATE = {
  metamask: {
    customAssets: { [ACCOUNT_ID_MOCK]: [ASSET_ID_MOCK] },
    assetsBalance: {
      [ACCOUNT_ID_MOCK]: { [ASSET_ID_MOCK]: { amount: '0' } },
    },
    assetsInfo: {
      [ASSET_ID_MOCK]: {
        type: 'erc20',
        symbol: SYMBOL_MOCK,
        name: 'USD Coin',
        decimals: DECIMALS_MOCK,
      },
    },
    remoteFeatureFlags: {
      assetsUnifyState: { enabled: true, featureVersion: '1' },
    },
  },
};

async function runHook(state: Record<string, unknown> = {}) {
  const result = renderHookWithProvider(
    () =>
      useAddToken({
        tokenAddress: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        symbol: SYMBOL_MOCK,
        decimals: DECIMALS_MOCK,
      }),
    merge({}, MOCK_STATE, state),
  );

  await act(async () => {
    // Intentionally empty
  });

  return result;
}

async function runLegacyHook({
  existingTokens,
}: { existingTokens?: { address: string }[] } = {}) {
  return runHook({
    metamask: {
      allTokens: {
        [CHAIN_ID_MOCK]: {
          [ACCOUNT_ADDRESS_MOCK]: existingTokens || [],
        },
      },
    },
  });
}

async function runUnifiedHook({
  assetsPrice,
}: { assetsPrice?: Record<string, unknown> } = {}) {
  return runHook(
    merge({}, UNIFIED_TOKEN_STATE, {
      metamask: { assetsPrice: assetsPrice ?? {} },
    }),
  );
}

describe('useAddToken', () => {
  const mockAddToken = actions.addToken as jest.Mock;
  const mockFindNetworkClientIdByChainId =
    actions.findNetworkClientIdByChainId as jest.Mock;
  const mockIsAssetsUnifyStateFeatureEnabled = jest.mocked(
    isAssetsUnifyStateFeatureEnabled,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    mockFindNetworkClientIdByChainId.mockResolvedValue(NETWORK_CLIENT_ID_MOCK);
    mockAddToken.mockReturnValue({ type: 'ADD_TOKEN' });
    mockIsAssetsUnifyStateFeatureEnabled.mockReturnValue(false);
  });

  it('adds token if not present', async () => {
    await runLegacyHook();

    expect(mockAddToken).toHaveBeenCalledWith(
      {
        address: TOKEN_ADDRESS_MOCK,
        decimals: DECIMALS_MOCK,
        networkClientId: NETWORK_CLIENT_ID_MOCK,
        symbol: SYMBOL_MOCK,
      },
      true,
    );
  });

  it('does not add token if already present', async () => {
    await runLegacyHook({
      existingTokens: [
        {
          address: TOKEN_ADDRESS_MOCK,
        },
      ],
    });

    expect(mockAddToken).not.toHaveBeenCalled();
  });

  describe('with unified assets state', () => {
    const originalBuildFlag = process.env.ASSETS_UNIFIED_STATE_ENABLED;

    beforeEach(() => {
      process.env.ASSETS_UNIFIED_STATE_ENABLED = 'true';
      mockIsAssetsUnifyStateFeatureEnabled.mockReturnValue(true);
    });

    afterAll(() => {
      process.env.ASSETS_UNIFIED_STATE_ENABLED = originalBuildFlag;
    });

    it('does not add token if it has a price and the native asset has a price', async () => {
      await runUnifiedHook({
        assetsPrice: {
          [ASSET_ID_MOCK]: FUNGIBLE_PRICE_MOCK,
          [NATIVE_ASSET_ID_MOCK]: NATIVE_FUNGIBLE_PRICE_MOCK,
        },
      });

      expect(mockAddToken).not.toHaveBeenCalled();
    });

    it('adds token again if it is present but has no price', async () => {
      await runUnifiedHook({
        assetsPrice: {
          [NATIVE_ASSET_ID_MOCK]: NATIVE_FUNGIBLE_PRICE_MOCK,
        },
      });

      expect(mockAddToken).toHaveBeenCalledWith(
        {
          address: TOKEN_ADDRESS_MOCK,
          decimals: DECIMALS_MOCK,
          networkClientId: NETWORK_CLIENT_ID_MOCK,
          symbol: SYMBOL_MOCK,
        },
        true,
      );
    });

    it('adds token again if the native asset has no price', async () => {
      await runUnifiedHook({
        assetsPrice: {
          [ASSET_ID_MOCK]: FUNGIBLE_PRICE_MOCK,
        },
      });

      expect(mockAddToken).toHaveBeenCalledTimes(1);
    });

    it('adds token again if the price entry is not fungible', async () => {
      await runUnifiedHook({
        assetsPrice: {
          [ASSET_ID_MOCK]: { assetPriceType: 'nft', price: 1, lastUpdated: 1 },
          [NATIVE_ASSET_ID_MOCK]: NATIVE_FUNGIBLE_PRICE_MOCK,
        },
      });

      expect(mockAddToken).toHaveBeenCalledTimes(1);
    });

    it('adds token again if the price entry has no price value', async () => {
      await runUnifiedHook({
        assetsPrice: {
          [ASSET_ID_MOCK]: { assetPriceType: 'fungible', lastUpdated: 1 },
          [NATIVE_ASSET_ID_MOCK]: NATIVE_FUNGIBLE_PRICE_MOCK,
        },
      });

      expect(mockAddToken).toHaveBeenCalledTimes(1);
    });
  });
});
