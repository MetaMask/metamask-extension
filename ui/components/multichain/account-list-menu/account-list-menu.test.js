/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import reactRouterDom from 'react-router-dom';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import messages from '../../../../app/_locales/en/messages.json';
import {
  ADD_SNAP_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
} from '../../../helpers/constants/routes';
///: END:ONLY_INCLUDE_IF
import { AccountListMenu } from '.';

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
const mockOnClose = jest.fn();
const mockGetEnvironmentType = jest.fn();

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => mockGetEnvironmentType,
}));
///: END:ONLY_INCLUDE_IF

const render = (props = { onClose: () => jest.fn() }) => {
  const store = configureStore({
    ...mockState,
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

describe('AccountListMenu', () => {
  const historyPushMock = jest.fn();

  jest
    .spyOn(reactRouterDom, 'useHistory')
    .mockImplementation()
    .mockReturnValue({ push: historyPushMock });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays important controls', () => {
    const { getByPlaceholderText, getByText } = render();

    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
    expect(getByText('Add account or hardware wallet')).toBeInTheDocument();
  });

  it('displays accounts for list and filters by search', () => {
    render();
    const listItems = document.querySelectorAll(
      '.multichain-account-list-item',
    );
    expect(listItems).toHaveLength(5);

    const searchBox = document.querySelector('input[type=search]');
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

    const searchBox = document.querySelector('input[type=search]');
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
      metamask: {
        ...mockState.metamask,
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
    const { getByText } = render();

    // Ensure the button is displaying
    const button = document.querySelectorAll(
      '[data-testid="multichain-account-menu-popover-action-button"]',
    );
    expect(button).toHaveLength(1);

    // Click the button to ensure the options and close button display
    button[0].click();
    expect(getByText('Add a new account')).toBeInTheDocument();
    expect(getByText('Import account')).toBeInTheDocument();
    expect(getByText('Add hardware wallet')).toBeInTheDocument();
    const header = document.querySelector('header');
    expect(header.innerHTML).toBe('Add account');
    expect(
      document.querySelector('button[aria-label="Close"]'),
    ).toBeInTheDocument();

    const backButton = document.querySelector('button[aria-label="Back"]');
    expect(backButton).toBeInTheDocument();
    backButton.click();

    expect(getByText('Select an account')).toBeInTheDocument();
  });

  it('shows the account creation UI when Add Account is clicked', () => {
    const { getByText, getByPlaceholderText } = render();

    const button = document.querySelector(
      '[data-testid="multichain-account-menu-popover-action-button"]',
    );
    button.click();

    fireEvent.click(getByText('Add a new account'));
    expect(getByText('Create')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(getByText('Cancel'));
    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
  });

  it('shows the account import UI when Import Account is clicked', () => {
    const { getByText, getByPlaceholderText } = render();

    const button = document.querySelector(
      '[data-testid="multichain-account-menu-popover-action-button"]',
    );
    button.click();

    fireEvent.click(getByText('Import account'));
    expect(getByText('Import')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();

    fireEvent.click(getByText('Cancel'));
    expect(getByPlaceholderText('Search accounts')).toBeInTheDocument();
  });

  it('navigates to hardware wallet connection screen when clicked', () => {
    const { getByText } = render();

    const button = document.querySelector(
      '[data-testid="multichain-account-menu-popover-action-button"]',
    );
    button.click();

    fireEvent.click(getByText('Add hardware wallet'));
    expect(historyPushMock).toHaveBeenCalledWith(CONNECT_HARDWARE_ROUTE);
  });

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  describe('addSnapAccountButton', () => {
    const renderWithState = (state, props = { onClose: mockOnClose }) => {
      const store = configureStore({
        ...mockState,
        ...{
          metamask: {
            ...mockState.metamask,
            ...state,
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
      const { getByText } = renderWithState({ addSnapAccountEnabled: false });
      const button = document.querySelector(
        '[data-testid="multichain-account-menu-popover-action-button"]',
      );
      button.click();
      expect(() => getByText(messages.settingAddSnapAccount.message)).toThrow(
        `Unable to find an element with the text: ${messages.settingAddSnapAccount.message}`,
      );
    });

    it("renders the add snap account button if it's enabled", async () => {
      const { getByText } = renderWithState({ addSnapAccountEnabled: true });
      const button = document.querySelector(
        '[data-testid="multichain-account-menu-popover-action-button"]',
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

    it('pushes history when clicking add snap account from extended view', async () => {
      const { getByText } = renderWithState({ addSnapAccountEnabled: true });
      mockGetEnvironmentType.mockReturnValueOnce('fullscreen');

      const button = document.querySelector(
        '[data-testid="multichain-account-menu-popover-action-button"]',
      );
      button.click();

      const addSnapAccountButton = getByText(
        messages.settingAddSnapAccount.message,
      );

      fireEvent.click(addSnapAccountButton);
      await waitFor(() => {
        expect(historyPushMock).toHaveBeenCalledWith(ADD_SNAP_ACCOUNT_ROUTE);
      });
    });
  });
  ///: END:ONLY_INCLUDE_IF
});
