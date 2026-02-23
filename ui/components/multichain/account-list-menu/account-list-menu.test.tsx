/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import {
  BtcAccountType,
  EthAccountType,
  EthScope,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { merge } from 'lodash';
import { fireEvent } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { AccountListMenu } from '.';

const mockGetEnvironmentType = jest.fn();
const mockDetectNfts = jest.fn();

// TODO: Remove this mock when multichain accounts feature flag is entirely removed.
// TODO: Convert any old tests (UI/UX state 1) to its state 2 equivalent (if possible).
jest.mock(
  '../../../../shared/lib/multichain-accounts/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../shared/lib/multichain-accounts/remote-feature-flag',
    ),
    isMultichainAccountsFeatureEnabled: () => false,
  }),
);

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => () => mockGetEnvironmentType(),
}));

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    detectNfts: () => mockDetectNfts,
  };
});

const render = (
  state = {},
  props: {
    onClose: () => void;
    allowedAccountTypes: KeyringAccountType[];
  } = {
    onClose: () => jest.fn(),
    allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
  },
  location: string = '/',
) => {
  // Ensures selector memoization works correctly without manual cache clearing
  // by creating fresh object references for each test run.
  // This aligns with immer's behavior of creating new object references for each update.
  const clonedMockState = structuredClone(mockState);
  const defaultState = {
    ...clonedMockState,
    metamask: {
      ...clonedMockState.metamask,
      remoteFeatureFlags: {
        bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
      },
      permissionHistory: {
        'https://test.dapp': {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
            },
          },
        },
      },
      subjects: {
        'https://test.dapp': {
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [
                          'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                        ],
                      },
                    },
                    isMultichainOrigin: false,
                  },
                },
              ],
              invoker: 'https://test.dapp',
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    },
    activeTab: {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
    unconnectedAccount: {
      state: 'OPEN',
    },
  };
  const store = configureStore(merge(defaultState, state));
  return renderWithProvider(<AccountListMenu {...props} />, store, location);
};

describe('AccountListMenu', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('displays important controls', () => {
    const { getByPlaceholderText, getByText } = render();

    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
    expect(getByText('Add account or hardware wallet')).toBeInTheDocument();
    expect(document.querySelector('[aria-label="Back"]')).toStrictEqual(null);
  });

  it('displays accounts for list and filters by search', () => {
    render();
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );

    expect(listItems).toHaveLength(6);

    const searchBox = document.querySelector('input[type=search]') as Element;
    fireEvent.change(searchBox, {
      target: { value: 'Le' },
    });

    const filteredListItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(filteredListItems).toHaveLength(1);
  });

  it('displays the "no accounts" message when search finds nothing', () => {
    const { getByTestId } = render();

    const searchBox = document.querySelector('input[type=search]') as Element;
    fireEvent.change(searchBox, {
      target: { value: 'adslfkjlx' },
    });

    const filteredListItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(filteredListItems).toHaveLength(0);
    expect(
      getByTestId('multichain-account-menu-popover-no-results'),
    ).toBeInTheDocument();
  });

  it('does not renders search bar when there is only one account', () => {
    const mockStore = configureStore({
      activeTab: {
        title: 'Eth Sign Tests',
        origin: 'https://remix.ethereum.org',
        protocol: 'https:',
        url: 'https://remix.ethereum.org/',
      },
      unconnectedAccount: {
        state: 'OPEN',
      },
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          accounts: {
            ...mockState.metamask.internalAccounts.accounts,
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              scopes: [EthScope.Eoa],
              type: EthAccountType.Eoa,
            },
          },
        },
        permissionHistory: {
          'https://test.dapp': {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            eth_accounts: {
              accounts: {
                '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
              },
            },
          },
        },
        subjects: {
          'https://test.dapp': {
            permissions: {
              'https://test.dapp': {
                permissions: {
                  'endowment:caip25': {
                    caveats: [
                      {
                        type: 'authorizedScopes',
                        value: {
                          requiredScopes: {},
                          optionalScopes: {
                            'eip155:1': {
                              accounts: [
                                'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                              ],
                            },
                          },
                          isMultichainOrigin: false,
                        },
                      },
                    ],
                    invoker: 'https://test.dapp',
                    parentCapability: 'endowment:caip25',
                  },
                },
              },
            },
          },
        },
        accounts: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            balance: '0x346ba7725f412cbfdb',
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          },
        },
      },
    });
    const { container } = renderWithProvider(
      <AccountListMenu onClose={jest.fn()} />,
      mockStore,
    );
    const searchBox = container.querySelector('input[type=search]');
    expect(searchBox).not.toBeInTheDocument();
  });

  it('renders search bar when there is more than one account', () => {
    render();
    const searchBox = document.querySelector('input[type=search]');
    expect(searchBox).toBeInTheDocument();
  });

  it('detects NFTs when an account is clicked', () => {
    const { getAllByTestId } = render();
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(listItems).toHaveLength(6);
    const button = getAllByTestId('account-item');
    button[0].click();
    expect(mockDetectNfts).toHaveBeenCalled();
  });

  it('displays the correct label for unnamed snap accounts', () => {
    const mockStore = configureStore({
      activeTab: {
        title: 'Eth Sign Tests',
        origin: 'https://remix.ethereum.org',
        protocol: 'https:',
        url: 'https://remix.ethereum.org/',
      },
      unconnectedAccount: {
        state: 'OPEN',
      },
      metamask: {
        ...mockState.metamask,
        permissionHistory: {
          'https://test.dapp': {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            eth_accounts: {
              accounts: {
                '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
              },
            },
          },
        },
        subjects: {
          'https://test.dapp': {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      requiredScopes: {},
                      optionalScopes: {
                        'eip155:1': {
                          accounts: [
                            'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                          ],
                        },
                      },
                      isMultichainOrigin: false,
                    },
                  },
                ],
                invoker: 'https://test.dapp',
                parentCapability: 'endowment:caip25',
              },
            },
          },
        },
        internalAccounts: {
          accounts: {
            ...mockState.metamask.internalAccounts.accounts,
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              ...mockState.metamask.internalAccounts.accounts[
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
              ],
              metadata: {
                name: 'Snap Account',
                keyring: {
                  type: 'Snap Keyring',
                },
                snap: {
                  id: 'local:snap-id',
                },
              },
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
      },
    });
    renderWithProvider(<AccountListMenu onClose={jest.fn()} />, mockStore);
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    const tag = listItems[0].querySelector('.mm-tag') as Element;
    expect(tag.textContent).toBe('mock snap name (Beta)');
  });

  it('displays the correct label for named snap accounts', () => {
    render({
      metamask: {
        internalAccounts: {
          accounts: {
            ...mockState.metamask.internalAccounts.accounts,
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              ...mockState.metamask.internalAccounts.accounts[
                'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
              ],
              metadata: {
                name: 'Snap Account',
                keyring: {
                  type: 'Snap Keyring',
                },
                snap: {
                  name: 'Test Snap Name',
                  id: 'local:snap-id',
                },
              },
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
      },
    });
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    const tag = listItems[0].querySelector('.mm-tag') as Element;
    expect(tag.textContent).toBe('mock snap name (Beta)');
  });

  describe('prop `allowedAccountTypes`', () => {
    // Test uses mockState's existing accounts which are all EVM EOA type
    // Testing that allowedAccountTypes properly filters the account list

    it('allows only EthAccountTypes', () => {
      // mockState accounts are all type: 'eip155:eoa' (EthAccountType.Eoa)
      // When we allow EOA, we should see the accounts
      render(
        {},
        {
          onClose: jest.fn(),
          allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
        },
      );

      // EOA accounts from mockState should be visible
      const listItems = document.querySelectorAll(
        '.multichain-account-list-item',
      );
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('allows only BtcAccountType', () => {
      // When we only allow BTC account types, EOA accounts should be filtered out
      render(
        {},
        {
          onClose: jest.fn(),
          allowedAccountTypes: [BtcAccountType.P2wpkh],
        },
      );

      // mockState has no BTC accounts, so no accounts should be visible
      const listItems = document.querySelectorAll(
        '.multichain-account-list-item',
      );
      expect(listItems).toHaveLength(0);
    });
  });
});
