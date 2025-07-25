/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import reactRouterDom from 'react-router-dom';
import { merge } from 'lodash';
import { KeyringTypes } from '@metamask/keyring-controller';
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
  IMPORT_SRP_ROUTE,
} from '../../../helpers/constants/routes';
///: END:ONLY_INCLUDE_IF
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { AccountMenu } from '.';

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
const mockOnClose = jest.fn();
const mockGetEnvironmentType = jest.fn();
const mockNextAccountName = jest.fn().mockReturnValue('Test Account 2');
const mockBitcoinClientCreateAccount = jest.fn();
const mockGenerateNewHdKeyring = jest.fn();
const mockDetectNfts = jest.fn();

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => () => mockGetEnvironmentType(),
}));
///: END:ONLY_INCLUDE_IF

jest.mock('../../../store/actions', () => {
  return {
    ...jest.requireActual('../../../store/actions'),
    generateNewHdKeyring: () => mockGenerateNewHdKeyring(),
    detectNfts: () => mockDetectNfts,
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
    getNextAvailableAccountName: () => mockNextAccountName(),
    getSnapId: () => 'bitcoin-snap-id',
    getSnapName: () => 'bitcoin-snap-name',
  }),
}));

const render = (
  state = {},
  props: {
    onClose: () => void;
  } = {
    onClose: () => jest.fn(),
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
  return renderWithProvider(<AccountMenu {...props} />, store, location);
};

describe('AccountMenu', () => {
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
    const { getByText } = render();

    expect(getByText('Add account or hardware wallet')).toBeInTheDocument();
    expect(document.querySelector('[aria-label="Back"]')).toStrictEqual(null);
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
    expect(getByText('Ethereum account')).toBeInTheDocument();
    expect(getByText('Private Key')).toBeInTheDocument();
    expect(getByText('Hardware wallet')).toBeInTheDocument();
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
    const { getByText, getByTestId } = render();

    const button = getByTestId('multichain-account-menu-popover-action-button');
    button.click();

    fireEvent.click(getByText('Ethereum account'));
    const header = document.querySelector('header') as Element;
    expect(header.innerHTML).toContain('Add Ethereum account');
    const addAccountButton = document.querySelector(
      '[data-testid="submit-add-account-with-name"]',
    );
    expect(addAccountButton).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(getByText('Cancel'));
    expect(getByText('Add account or hardware wallet')).toBeInTheDocument();
  });

  it('shows the account import UI when Import Private Key is clicked', () => {
    const { getByText, getByTestId } = render();

    const button = getByTestId('multichain-account-menu-popover-action-button');
    button.click();

    fireEvent.click(getByText('Private Key'));
    expect(getByText('Import')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(getByText('Cancel'));
    expect(getByText('Add account or hardware wallet')).toBeInTheDocument();
  });

  it('navigates to hardware wallet connection screen when clicked', () => {
    const { getByText, getByTestId } = render();

    const button = getByTestId('multichain-account-menu-popover-action-button');
    button.click();

    fireEvent.click(getByText('Hardware wallet'));
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
        },
        activeTab: {
          id: 113,
          title: 'E2E Test Dapp',
          origin: 'https://metamask.github.io',
          protocol: 'https:',
          url: 'https://metamask.github.io/test-dapp/',
        },
      });
      return renderWithProvider(<AccountMenu {...props} />, store);
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
  ///: END:ONLY_INCLUDE_IF

  describe('BTC account creation', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('calls the bitcoin client to create an account', async () => {
      mockNextAccountName.mockReturnValue('Snap Account 1');
      const { getByText, getByTestId } = render();

      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();

      const createBtcAccountButton = getByText(
        messages.addBitcoinAccountLabel.message,
      );
      createBtcAccountButton.click();

      const addBtcAccountButton = getByTestId('submit-add-account-with-name');
      addBtcAccountButton.click();

      expect(mockBitcoinClientCreateAccount).toHaveBeenCalled();
    });

    // Skipping this test for now, since the flow has changed a bit when multi-SRP is enabled (and we have no way
    // to disable it "programmatically" in the test)
    it.skip('redirects the user to the approval after clicking create account in the settings page', async () => {
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
        messages.addBitcoinAccountLabel.message,
      );
      createBtcAccountButton.click();

      const addBtcAccountButton = getByTestId('submit-add-account-with-name');
      addBtcAccountButton.click();

      expect(historyPushMock).toHaveBeenCalledWith(CONFIRMATION_V_NEXT_ROUTE);
      expect(mockBitcoinClientCreateAccount).toHaveBeenCalled();
    });
  });

  describe('Multi Srp', () => {
    it('redirects to import srp component', () => {
      const { getByTestId } = render();

      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      button.click();

      const addAccountButton = getByTestId(
        'multichain-account-menu-popover-import-srp',
      );
      addAccountButton.click();

      expect(historyPushMock).toHaveBeenCalledWith(IMPORT_SRP_ROUTE);
    });

    it('shows srp list if there are multiple srps when adding a new account', async () => {
      mockNextAccountName.mockReturnValue('Next HD Account');

      const accountInSecondSrp = createMockInternalAccount({
        address: '0xb1baf6a2f4a808937bb97a2f12ccf08f1233e3d9',
        name: 'Account in second Srp',
      });
      const secondHdKeyring = {
        accounts: [accountInSecondSrp.address],
        type: KeyringTypes.hd,
        metadata: {
          id: '01JN2RD391JM4K7Q5T4RP3JXMA',
          name: '',
        },
      };

      const { getByTestId } = render({
        metamask: {
          ...mockState.metamask,
          accounts: {
            [accountInSecondSrp.address]: {
              address: accountInSecondSrp.address,
              balance: '0x0',
            },
          },
          keyrings: [...mockState.metamask.keyrings, secondHdKeyring],
          internalAccounts: {
            ...mockState.metamask.internalAccounts,
            accounts: {
              ...mockState.metamask.internalAccounts.accounts,
              [accountInSecondSrp.id]: accountInSecondSrp,
            },
            selectedAccount: accountInSecondSrp.id,
          },
        },
      });

      const button = getByTestId(
        'multichain-account-menu-popover-action-button',
      );
      await button.click();

      const addAccountButton = getByTestId(
        'multichain-account-menu-popover-add-account',
      );
      await addAccountButton.click();

      expect(getByTestId('select-srp-container')).toBeInTheDocument();
    });
  });

  it('should render institutional wallet button if manage institutional wallets is enabled', () => {
    const { getByText, getByTestId } = render({
      metamask: {
        ...mockState.metamask,
        manageInstitutionalWallets: true,
      },
    });

    // Click the action button to enter menu mode
    const actionButton = getByTestId(
      'multichain-account-menu-popover-action-button',
    );
    actionButton.click();

    expect(getByText('Manage Institutional Wallets')).toBeInTheDocument();
  });
});
