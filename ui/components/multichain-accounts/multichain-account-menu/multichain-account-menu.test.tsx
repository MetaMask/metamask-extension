import React from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MultichainAccountMenu } from './multichain-account-menu';
import type { MultichainAccountMenuProps } from './multichain-account-menu.types';

const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('MultichainAccountMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (
    props: MultichainAccountMenuProps = {
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: false,
    },
  ) => {
    return renderWithProvider(<MultichainAccountMenu {...props} />);
  };

  it('renders the menu button and popover is initially closed', () => {
    renderComponent();

    const menuButton = document.querySelector(
      '.multichain-account-menu-button',
    );

    expect(menuButton).toBeInTheDocument();

    const menuIcon = document.querySelector(
      '.multichain-account-menu-button-icon',
    );

    expect(menuIcon).toBeInTheDocument();
    expect(document.querySelector('.mm-popover--open')).not.toBeInTheDocument();
  });

  it('opens the popover menu when clicking the menu button', async () => {
    renderComponent();

    const menuButton = document.querySelector(
      '.multichain-account-menu-button',
    );

    expect(menuButton).not.toBeNull();

    if (menuButton) {
      await act(async () => {
        fireEvent.click(menuButton);
        await waitFor(() => {
          expect(
            document.querySelector('.mm-popover--open'),
          ).toBeInTheDocument();
        });
      });
    }

    const popover = document.querySelector('.mm-popover--open');

    expect(popover).toBeInTheDocument();

    const menuItems = document.querySelectorAll(
      '.multichain-account-menu-item',
    );

    expect(menuItems.length).toBe(5);
  });

  it('adds the remove option to menu when isRemovable is true', async () => {
    renderComponent({
      accountGroupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
      isRemovable: true,
    });

    const menuButton = document.querySelector(
      '.multichain-account-menu-button',
    );

    expect(menuButton).not.toBeNull();

    if (menuButton) {
      await act(async () => {
        fireEvent.click(menuButton);
        await waitFor(() => {
          expect(
            document.querySelector('.mm-popover--open'),
          ).toBeInTheDocument();
        });
      });
    }

    const menuItems = document.querySelectorAll(
      '.multichain-account-menu-item',
    );

    expect(menuItems.length).toBe(6);

    const removeOption = document.querySelector('.mm-box--color-error-default');

    expect(removeOption).toBeInTheDocument();
  });

  it('navigates to account details page when clicking the account details option', async () => {
    renderComponent();

    const menuButton = document.querySelector(
      '.multichain-account-menu-button',
    );

    expect(menuButton).not.toBeNull();

    if (menuButton) {
      await act(async () => {
        fireEvent.click(menuButton);
        await waitFor(() => {
          expect(
            document.querySelector('.mm-popover--open'),
          ).toBeInTheDocument();
        });
      });
    }

    const accountDetailsOption = document.querySelector(
      '.multichain-account-menu-item',
    );

    expect(accountDetailsOption).not.toBeNull();

    if (accountDetailsOption) {
      await act(async () => {
        fireEvent.click(accountDetailsOption);
      });
    }

    expect(mockHistoryPush).toHaveBeenCalledWith(
      '/multichain-account-details/entropy%3A01JKAF3DSGM3AB87EM9N0K41AJ%2Fdefault',
    );
  });

  it('toggles the popover state when clicking the menu button multiple times', async () => {
    renderComponent();

    const menuButton = document.querySelector(
      '.multichain-account-menu-button',
    );

    expect(menuButton).not.toBeNull();

    if (menuButton) {
      // First click - open menu
      await act(async () => {
        fireEvent.click(menuButton);
        await waitFor(() => {
          expect(
            document.querySelector('.mm-popover--open'),
          ).toBeInTheDocument();
        });
      });

      // Second click - close menu
      await act(async () => {
        fireEvent.click(menuButton);
        await waitFor(() => {
          expect(
            document.querySelector('.mm-popover--open'),
          ).not.toBeInTheDocument();
        });
      });

      // Third click - open menu again
      await act(async () => {
        fireEvent.click(menuButton);
        await waitFor(() => {
          expect(
            document.querySelector('.mm-popover--open'),
          ).toBeInTheDocument();
        });
      });
    }
  });
});
