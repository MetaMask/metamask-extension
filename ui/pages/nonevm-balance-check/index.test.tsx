//========
// Changes to this file demonstrate how the use of `useMessenger` in a route
// entrypoint can be tested. (See the implementation file for
// `NonEvmBalanceCheck` for how `useMessenger` actually gets used.)
//========

import React from 'react';
import { act } from '@testing-library/react';
import { SolAccountType, SolMethod, SolScope } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import configureStore from '../../store/store';
import * as selectors from '../../selectors/selectors';
import * as metametricsSelectors from '../../selectors/metametrics';
import * as multichainSelectors from '../../selectors/multichain';
import * as useMultichainBalancesModule from '../../hooks/useMultichainBalances';
import type { useMultichainBalances } from '../../hooks/useMultichainBalances';
import { NonEvmBalanceCheck } from '.';
import ExtensionPlatform from '../../../app/scripts/platforms/extension';

const MOCK_SOLANA_CHAIN_ID = MultichainNetworks.SOLANA;

const MOCK_SOLANA_ACCOUNT = {
  id: 'solana-account-1',
  address: 'ABCDEu4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8J',
  type: SolAccountType.DataAccount,
  scopes: [SolScope.Mainnet],
  methods: [SolMethod.SignMessage],
  options: {},
  metadata: {
    name: 'Solana Account 1',
    importTime: 1755013234384,
    lastSelected: 1755717637857,
    keyring: { type: 'Snap Keyring' },
  },
} as const satisfies InternalAccount;

jest.mock(
  '../../components/multichain/network-list-menu/add-non-evm-account/add-non-evm-account',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => <div data-testid="add-non-evm-account-modal" />,
  }),
);

function createStore() {
  return configureStore({});
}

function setupSpies({
  metaMetricsId = 'mock-metametrics-id',
  participateInMetaMetrics = false,
  dataCollectionForMarketing = false,
  accountsOrdered = [MOCK_SOLANA_ACCOUNT],
  lastSelectedNonEvmAccount = MOCK_SOLANA_ACCOUNT,
  multichainBalances = { assetsWithBalance: [], balanceByChainId: {} },
}: {
  metaMetricsId?: string | null;
  participateInMetaMetrics?: boolean;
  dataCollectionForMarketing?: boolean;
  accountsOrdered?: InternalAccount[];
  lastSelectedNonEvmAccount?: InternalAccount | undefined;
  multichainBalances?: ReturnType<typeof useMultichainBalances>;
} = {}) {
  jest.spyOn(selectors, 'getMetaMetricsId').mockReturnValue(metaMetricsId);
  jest
    .spyOn(metametricsSelectors, 'getParticipateInMetaMetrics')
    .mockReturnValue(participateInMetaMetrics);
  jest
    .spyOn(metametricsSelectors, 'getDataCollectionForMarketing')
    .mockReturnValue(dataCollectionForMarketing);
  jest
    .spyOn(selectors, 'getMetaMaskAccountsOrdered')
    .mockReturnValue(accountsOrdered);
  jest
    .spyOn(multichainSelectors, 'getLastSelectedNonEvmAccount')
    .mockReturnValue(lastSelectedNonEvmAccount);
  jest
    .spyOn(useMultichainBalancesModule, 'useMultichainBalances')
    .mockReturnValue(multichainBalances);
};

describe('NonEvmBalanceCheck', () => {
  let originalPlatform: ExtensionPlatform;

  beforeEach(() => {
    // @ts-expect-error We're not providing a full platform object.
    globalThis.platform = {
      getExtensionURL: (route: string, query: string) =>
        `chrome-extension://id/${route}?${query}`,
    }
  })

  afterEach(() => {
    jest.resetAllMocks();
    globalThis.platform = originalPlatform;
  });

  describe('when the last selected non-EVM account matches the chain', () => {
    it('calls messenger.call with AccountsController:setSelectedAccount and the account address', async () => {
      const mockSetSelectedAccount = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        'AccountsController:setSelectedAccount': mockSetSelectedAccount,
      });
      setupSpies({
        accountsOrdered: [MOCK_SOLANA_ACCOUNT],
        lastSelectedNonEvmAccount: MOCK_SOLANA_ACCOUNT,
      });
      await act(async () => {
        renderWithProvider(<NonEvmBalanceCheck />, {
          store: createStore(),
          messenger,
          router: {
            pathname: `/?chainId=${encodeURIComponent(MOCK_SOLANA_CHAIN_ID)}`,
          },
        });
      });

      expect(mockSetSelectedAccount).toHaveBeenCalledTimes(1);
      expect(mockSetSelectedAccount).toHaveBeenCalledWith(
        MOCK_SOLANA_ACCOUNT.address,
      );
    });
  });

  describe('when the last selected non-EVM account does not match the chain', () => {
    it('does not call messenger.call with AccountsController:setSelectedAccount', async () => {
      const mockSetSelectedAccount = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        'AccountsController:setSelectedAccount': mockSetSelectedAccount,
      });
      const accountOnDifferentChain = {
        ...MOCK_SOLANA_ACCOUNT,
        scopes: ['bip122:000000000019d6689c085ae165831e93'],
      } as const satisfies InternalAccount;
      setupSpies({
        accountsOrdered: [MOCK_SOLANA_ACCOUNT],
        lastSelectedNonEvmAccount: accountOnDifferentChain,
      });

      await act(async () => {
        renderWithProvider(<NonEvmBalanceCheck />, {
          store: createStore(),
          messenger,
          router: {
            pathname: `/?chainId=${encodeURIComponent(MOCK_SOLANA_CHAIN_ID)}`,
          },
        });
      });

      expect(mockSetSelectedAccount).not.toHaveBeenCalled();
    });
  });

  describe('when there is no account for the chain', () => {
    it('does not call messenger.call with AccountsController:setSelectedAccount', async () => {
      const mockSetSelectedAccount = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        'AccountsController:setSelectedAccount': mockSetSelectedAccount,
      });
      const evmAccount = {
        ...MOCK_SOLANA_ACCOUNT,
        scopes: ['eip155:0'],
      } as const satisfies InternalAccount;
      setupSpies({
        accountsOrdered: [evmAccount],
        lastSelectedNonEvmAccount: undefined,
      });

      await act(async () => {
        renderWithProvider(<NonEvmBalanceCheck />, {
          store: createStore(),
          messenger,
          router: {
            pathname: `/?chainId=${encodeURIComponent(MOCK_SOLANA_CHAIN_ID)}`,
          },
        });
      });

      expect(mockSetSelectedAccount).not.toHaveBeenCalled();
    });
  });

  describe('when chainId is missing from the URL', () => {
    it('does not call messenger.call with AccountsController:setSelectedAccount', async () => {
      const mockSetSelectedAccount = jest.fn().mockResolvedValue(undefined);
      const messenger = createMockRouteMessenger({
        'AccountsController:setSelectedAccount': mockSetSelectedAccount,
      });
      setupSpies({
        accountsOrdered: [MOCK_SOLANA_ACCOUNT],
        lastSelectedNonEvmAccount: MOCK_SOLANA_ACCOUNT,
      });

      await act(async () => {
        renderWithProvider(<NonEvmBalanceCheck />, {
          store: createStore(),
          messenger,
          router: { pathname: '/' },
        });
      });

      expect(mockSetSelectedAccount).not.toHaveBeenCalled();
    });
  });
});
