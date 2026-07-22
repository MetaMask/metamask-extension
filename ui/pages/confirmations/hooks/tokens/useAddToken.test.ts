import { act } from '@testing-library/react';
import { merge } from 'lodash';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../../store/actions';
import * as assetsUnifyStateSelectors from '../../../../selectors/assets-unify-state/feature-flags';
import * as accountTreeSelectors from '../../../../selectors/multichain-accounts/account-tree';
import { useAddToken } from './useAddToken';

jest.mock('../../../../store/actions', () => ({
  addCustomAsset: jest.fn(),
  addToken: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

jest.mock('../../../../selectors/assets-unify-state/feature-flags', () => ({
  getIsAssetsUnifyStateEnabled: jest.fn(),
}));

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(),
}));

const TOKEN_ADDRESS_MOCK = '0x1234' as const;
const CHAIN_ID_MOCK = '0x1' as const;
const CAIP_CHAIN_ID_MOCK = 'eip155:1';
const CAIP_ASSET_TYPE_MOCK = `${CAIP_CHAIN_ID_MOCK}/erc20:${TOKEN_ADDRESS_MOCK}`;
const NETWORK_CLIENT_ID_MOCK = 'mockNetworkClientId';
const SYMBOL_MOCK = 'TST';
const NAME_MOCK = 'Test Token';
const DECIMALS_MOCK = 6;
const ACCOUNT_ADDRESS_MOCK = '0xAccountAddress';
const EVM_GROUP_ACCOUNT_ID_MOCK = 'evm-group-account-1';

const MOCK_STATE = {
  metamask: {
    internalAccounts: {
      selectedAccount: 'account-1',
      accounts: {
        'account-1': {
          id: 'account-1',
          address: ACCOUNT_ADDRESS_MOCK,
          metadata: { name: 'Account 1' },
        },
      },
    },
  },
};

async function runHook({
  existingTokens,
  name,
}: {
  existingTokens?: { address: string }[];
  name?: string;
} = {}) {
  const result = renderHookWithProvider(
    () =>
      useAddToken({
        tokenAddress: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        symbol: SYMBOL_MOCK,
        decimals: DECIMALS_MOCK,
        name,
      }),
    merge({}, MOCK_STATE, {
      metamask: {
        allTokens: {
          [CHAIN_ID_MOCK]: {
            [ACCOUNT_ADDRESS_MOCK]: existingTokens || [],
          },
        },
      },
    }),
  );

  await act(async () => {
    // Intentionally empty
  });

  return result;
}

describe('useAddToken', () => {
  const mockAddToken = actions.addToken as jest.Mock;
  const mockAddCustomAsset = actions.addCustomAsset as jest.Mock;
  const mockFindNetworkClientIdByChainId =
    actions.findNetworkClientIdByChainId as jest.Mock;
  const mockGetIsAssetsUnifyStateEnabled =
    assetsUnifyStateSelectors.getIsAssetsUnifyStateEnabled as jest.Mock;
  const mockGetInternalAccountBySelectedAccountGroupAndCaip =
    accountTreeSelectors.getInternalAccountBySelectedAccountGroupAndCaip as unknown as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    mockFindNetworkClientIdByChainId.mockResolvedValue(NETWORK_CLIENT_ID_MOCK);
    mockAddToken.mockReturnValue({ type: 'ADD_TOKEN' });
    mockAddCustomAsset.mockReturnValue({ type: 'ADD_CUSTOM_ASSET' });
    mockGetIsAssetsUnifyStateEnabled.mockReturnValue(false);
    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(null);
  });

  it('adds token if not present', async () => {
    await runHook();

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
    await runHook({
      existingTokens: [
        {
          address: TOKEN_ADDRESS_MOCK,
        },
      ],
    });

    expect(mockAddToken).not.toHaveBeenCalled();
    expect(mockAddCustomAsset).not.toHaveBeenCalled();
  });

  it('does not call addCustomAsset when assets-unify-state flag is off', async () => {
    mockGetIsAssetsUnifyStateEnabled.mockReturnValue(false);
    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue({
      id: EVM_GROUP_ACCOUNT_ID_MOCK,
    });

    await runHook();

    expect(mockAddToken).toHaveBeenCalled();
    expect(mockAddCustomAsset).not.toHaveBeenCalled();
  });

  it('does not call addCustomAsset when no EVM account is resolved for the selected group', async () => {
    mockGetIsAssetsUnifyStateEnabled.mockReturnValue(true);
    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(null);

    await runHook();

    expect(mockAddToken).toHaveBeenCalled();
    expect(mockAddCustomAsset).not.toHaveBeenCalled();
  });

  it('calls addCustomAsset with CAIP-19 asset id when flag is on and an EVM account is resolved', async () => {
    mockGetIsAssetsUnifyStateEnabled.mockReturnValue(true);
    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue({
      id: EVM_GROUP_ACCOUNT_ID_MOCK,
    });

    await runHook({ name: NAME_MOCK });

    expect(mockAddCustomAsset).toHaveBeenCalledWith(
      EVM_GROUP_ACCOUNT_ID_MOCK,
      CAIP_ASSET_TYPE_MOCK,
      {
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        decimals: DECIMALS_MOCK,
        name: NAME_MOCK,
        symbol: SYMBOL_MOCK,
      },
    );
  });

  it('falls back to symbol when name is not provided in the pending metadata', async () => {
    mockGetIsAssetsUnifyStateEnabled.mockReturnValue(true);
    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue({
      id: EVM_GROUP_ACCOUNT_ID_MOCK,
    });

    await runHook();

    expect(mockAddCustomAsset).toHaveBeenCalledWith(
      EVM_GROUP_ACCOUNT_ID_MOCK,
      CAIP_ASSET_TYPE_MOCK,
      expect.objectContaining({ name: SYMBOL_MOCK }),
    );
  });
});
