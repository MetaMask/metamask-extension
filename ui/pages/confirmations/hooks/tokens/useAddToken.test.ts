import { act } from '@testing-library/react';
import { merge } from 'lodash';

import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../../store/actions';
import { useAddToken } from './useAddToken';

jest.mock('../../../../store/actions', () => ({
  addToken: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
}));

const TOKEN_ADDRESS_MOCK = '0x1234' as const;
const CHAIN_ID_MOCK = '0x1' as const;
const NETWORK_CLIENT_ID_MOCK = 'mockNetworkClientId';
const SYMBOL_MOCK = 'TST';
const DECIMALS_MOCK = 6;
const ACCOUNT_ADDRESS_MOCK = '0xAccountAddress';

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
}: { existingTokens?: { address: string }[] } = {}) {
  const result = renderHookWithProvider(
    () =>
      useAddToken({
        tokenAddress: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        symbol: SYMBOL_MOCK,
        decimals: DECIMALS_MOCK,
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
  const mockAddToken = jest.mocked(actions.addToken);
  const mockFindNetworkClientIdByChainId = jest.mocked(
    actions.findNetworkClientIdByChainId,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    mockFindNetworkClientIdByChainId.mockResolvedValue(NETWORK_CLIENT_ID_MOCK);
    mockAddToken.mockReturnValue({ type: 'ADD_TOKEN' } as never);
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
  });
});
