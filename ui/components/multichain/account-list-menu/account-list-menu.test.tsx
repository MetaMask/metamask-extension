/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import reactRouterDom from 'react-router-dom';
import {
  BtcAccountType,
  EthAccountType,
  EthScope,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { merge } from 'lodash';
import { KeyringTypes } from '@metamask/keyring-controller';
import { fireEvent } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { AccountListMenu } from '.';

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
const mockGetEnvironmentType = jest.fn();
const mockDetectNfts = jest.fn();

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => () => mockGetEnvironmentType(),
}));
///: END:ONLY_INCLUDE_IF

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    detectNfts: () => mockDetectNfts,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

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
  const defaultState = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        addBitcoinAccount: true,
      },
      permissionHistory: {
        'https://test.dapp': {
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
  const historyPushMock = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: historyPushMock });
  });

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
  ///: END:ONLY_INCLUDE_IF

  describe('prop `allowedAccountTypes`', () => {
    const mockAccount = createMockInternalAccount();
    const mockBtcAccount = createMockInternalAccount({
      name: 'Bitcoin Account',
      type: BtcAccountType.P2wpkh,
      keyringType: KeyringTypes.snap,
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    });
    const defaultMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          accounts: {
            [mockAccount.id]: mockAccount,
            [mockBtcAccount.id]: mockBtcAccount,
          },
          selectedAccount: mockAccount.id,
        },
        keyrings: [
          {
            type: 'HD Key Tree',
            accounts: [mockAccount.address],
          },
          {
            type: 'Snap Keyring',
            accounts: [mockBtcAccount.address],
          },
        ],
      },
    };

    it('allows only EthAccountTypes', () => {
      const { queryByText } = render(defaultMockState, {
        onClose: jest.fn(),
        allowedAccountTypes: [EthAccountType.Eoa, EthAccountType.Erc4337],
      });

      expect(queryByText(mockAccount.metadata.name)).toBeInTheDocument();
      expect(queryByText(mockBtcAccount.metadata.name)).not.toBeInTheDocument();
    });

    it('allows only BtcAccountType', () => {
      const { queryByText } = render(defaultMockState, {
        onClose: jest.fn(),
        allowedAccountTypes: [BtcAccountType.P2wpkh],
      });

      expect(queryByText(mockAccount.metadata.name)).not.toBeInTheDocument();
      expect(queryByText(mockBtcAccount.metadata.name)).toBeInTheDocument();
    });
  });
});
