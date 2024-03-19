import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConnectedAccountsMenu } from '.';

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: jest.fn(),
  identity: { address: '0x123' },
  anchorElement: null,
  disableAccountSwitcher: false,
  closeMenu: jest.fn(),
};

const renderComponent = (props = {}, stateChanges = {}) => {
  const store = configureStore({
    ...mockState,
    ...stateChanges,
    activeTab: {
      origin: 'https://example.com',
    },
  });
  document.body.innerHTML = '<div id="anchor"></div>';
  const anchorElement = document.getElementById('anchor');
  return renderWithProvider(
    <ConnectedAccountsMenu
      {...DEFAULT_PROPS}
      {...props}
      anchorElement={anchorElement}
    />,
    store,
  );
};

describe('ConnectedAccountsMenu', () => {
  it('renders permission details menu item', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('permission-details-menu-item')).toBeInTheDocument();
  });

  it('renders switch to this account menu item if account switcher is enabled', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('switch-account-menu-item')).toBeInTheDocument();
  });

  it('does not render switch to this account menu item if account switcher is disabled', async () => {
    const { queryByTestId } = renderComponent({ disableAccountSwitcher: true });
    expect(queryByTestId('switch-account-menu-item')).toBeNull();
  });

  it('renders disconnect menu item', async () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('disconnect-menu-item')).toBeInTheDocument();
  });

  it('closes the menu on tab key down when focus is within the menu', async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderComponent({ onClose });
    const menu = getByTestId('permission-details-menu-item');
    fireEvent.keyDown(menu, { key: 'Tab' });
    expect(onClose).toHaveBeenCalled();
  });
});
