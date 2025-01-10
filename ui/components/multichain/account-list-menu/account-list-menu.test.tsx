/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import reactRouterDom from 'react-router-dom';
import {
  BtcAccountType,
  EthAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { merge } from 'lodash';
import { fireEvent, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
} from '../../../helpers/constants/routes';
///: END:ONLY_INCLUDE_IF
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { AccountListMenu } from '.';

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
const mockOnClose = jest.fn();
const mockGetEnvironmentType = jest.fn();
const mockNextAccountName = jest.fn().mockReturnValue('Test Account 2');
const mockBitcoinClientCreateAccount = jest.fn();

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => () => mockGetEnvironmentType(),
}));
///: END:ONLY_INCLUDE_IF

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    getNextAvailableAccountName: () => mockNextAccountName,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(() => []),
}));

jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => ({
  ...jest.requireActual(
    '../../../hooks/accounts/useMultichainWalletSnapClient',
  ),
  useMultichainWalletSnapClient: () => ({
    createAccount: mockBitcoinClientCreateAccount,
  }),
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
      bitcoinSupportEnabled: true,
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

  it('should not render search bar when there is only one account', () => {
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

  it('should render search bar when there is more than one account', () => {
    render();
    const searchBox = document.querySelector('input[type=search]');
    expect(searchBox).toBeInTheDocument();
  });

  it('add / Import / Hardware button functions as it should', () => {
    const { getByText, getAllByTestId, getByLabelText } = render();

    // Ensure the button is displaying
    const button = getAllByTestId(
      'multichain-account-menu-popover-action-button',
    );
    expect(button).toHaveLength(1);

    // Click the button to ensure the options and close button display
    button[0].click();
    expect(getByText('Add a new Ethereum account')).toBeInTheDocument();
    expect(getByText('Import account')).toBeInTheDocument();
    expect(getByText('Add hardware wallet')).toBeInTheDocument();
    const header = document.querySelector('header') as Element;
    expect(header.innerHTML).toContain('Add account');
    expect(
      document.querySelector('button[aria-label="Close"]'),
    ).toBeInTheDocument();

    const backButton = getByLabelText('Back');
    expect(backButton).toBeInTheDocument();
    backButton.click();

    expect(getByText('Select an account')).toBeInTheDocument();
  });

  it('shows the account creation UI when Add Account is clicked', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render();

    const button = getByTestId('multichain-account-menu-popover-action-button');
    button.click();

    fireEvent.click(getByText('Add a new Ethereum account'));
    const addAccountButton = document.querySelector(
      '[data-testid="submit-add-account-with-name"]',
    );
    expect(addAccountButton).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(getByText('Cancel'));
    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
  });

  it('shows the account import UI when Import Account is clicked', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render();

    const button = getByTestId('multichain-account-menu-popover-action-button');
    button.click();

    fireEvent.click(getByText('Import account'));
    expect(getByText('Import')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(getByText('Cancel'));
    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
  });

  it('navigates to hardware wallet connection screen when clicked', () => {
    const { getByText, getByTestId } = render();

    const button = getByTestId('multichain-account-menu-popover-action-button');
    button.click();

    fireEvent.click(getByText('Add hardware wallet'));
    expect(historyPushMock).toHaveBeenCalledWith(CONNECT_HARDWARE_ROUTE);
  });

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  describe('addSnapAccountButton', () => {
    const renderWithState = (
      state: { addSnapAccountEnabled: boolean },
      props = { onClose: mockOnClose },
    ) => {
      const store = configureStore({
        ...mockState,
        ...{
          metamask: {
            ...mockState.metamask,
            ...state,
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
        },
        activeTab: {
          id: 113,
          title: 'E2E Test Dapp',
          origin: 'https://metamask.github.io',
          protocol: 'https:',
          url: 'https://metamask.github.io/test-dapp/',
        },
      });
      return renderWithProvider(<AccountListMenu {...props} />, store);
    };

    it("doesn't render the add snap account button if it's disabled", async () => {
      const { getByText, getByTestId } = renderWithState({
        addSnapAccountEnabled: false,
      });
      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();
      expect(() => getByText(messages.settingAddSnapAccount.message)).toThrow(
        `Unable to find an element with the text: ${messages.settingAddSnapAccount.message}`,
      );
    });

    it('renders the "Add account Snap" button if it\'s enabled', async () => {
      // @ts-expect-error mocking platform
      global.platform = { openTab: jest.fn() };
      const { getByText, getByTestId } = renderWithState({
        addSnapAccountEnabled: true,
      });
      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();
      const addSnapAccountButton = getByText(
        messages.settingAddSnapAccount.message,
      );
      expect(addSnapAccountButton).toBeInTheDocument();

      fireEvent.click(addSnapAccountButton);
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('opens the Snaps registry in a new tab', async () => {
      // Set up mock state
      // @ts-expect-error mocking platform
      global.platform = { openTab: jest.fn() };
      const { getByText, getByTestId } = renderWithState({
        addSnapAccountEnabled: true,
      });
      mockGetEnvironmentType.mockReturnValueOnce('fullscreen');

      // Open account picker
      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();

      // Click on "Add account Snap"
      const addAccountSnapButton = getByText(
        messages.settingAddSnapAccount.message,
      );
      fireEvent.click(addAccountSnapButton);

      // Check if `openTab` was called
      expect(global.platform.openTab).toHaveBeenCalledTimes(1);
    });
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

  describe('BTC account creation', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('calls the bitcoin client to create an account', async () => {
      const { getByText, getByTestId } = render();

      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();

      const createBtcAccountButton = getByText(
        messages.addNewBitcoinAccount.message,
      );

      createBtcAccountButton.click();

      expect(mockBitcoinClientCreateAccount).toHaveBeenCalled();
    });

    it('redirects the user to the approval after clicking create account in the settings page', async () => {
      const { getByText, getByTestId } = render(
        undefined,
        undefined,
        '/settings',
      );

      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();

      const createBtcAccountButton = getByText(
        messages.addNewBitcoinAccount.message,
      );

      createBtcAccountButton.click();

      expect(historyPushMock).toHaveBeenCalledWith(CONFIRMATION_V_NEXT_ROUTE);
      expect(mockBitcoinClientCreateAccount).toHaveBeenCalled();
    });
  });

  describe('prop `allowedAccountTypes`', () => {
    const mockAccount = createMockInternalAccount();
    const mockBtcAccount = createMockInternalAccount({
      name: 'Bitcoin Account',
      type: BtcAccountType.P2wpkh,
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
