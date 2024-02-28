import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConnectedAccountsMenu } from '.';

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: jest.fn(),
};

const render = (props = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  const allProps = { ...DEFAULT_PROPS, ...props };
  document.body.innerHTML = '<div id="anchor"></div>';
  const anchorElement = document.getElementById('anchor') as HTMLElement;
  return renderWithProvider(
    <ConnectedAccountsMenu anchorElement={anchorElement} {...allProps} />,
    store,
  );
};

describe('ConnectedAccountsMenu', () => {
  it('renders permission details menu item', () => {
    const { getByText } = render();
    expect(getByText('Permission details')).toBeInTheDocument();
  });

  it('renders switch to this account menu item', () => {
    const { getByText } = render();
    expect(getByText('Switch to this account')).toBeInTheDocument();
  });

  it('renders disconnect menu item', () => {
    const { getByText } = render();
    expect(getByText('Disconnect')).toBeInTheDocument();
  });

  it('closes the menu on tab key down when focus is on the last menu item', () => {
    const onClose = jest.fn();
    const { getByText } = render({ onClose });
    const disconnectMenuItem = getByText('Disconnect');
    fireEvent.keyDown(disconnectMenuItem, { key: 'Tab' });
    expect(onClose).toHaveBeenCalled();
  });
});
