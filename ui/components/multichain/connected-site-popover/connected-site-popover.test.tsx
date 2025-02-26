import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ConnectedSitePopover } from './connected-site-popover';
import { Store, AnyAction } from 'redux';

const mockStore = configureStore([]);

describe('ConnectedSitePopover', () => {
  let store: Store<any, AnyAction>;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        providerConfig: { chainId: '0x1', nickname: 'Ethereum Mainnet' },
      },
    });
    store.dispatch = jest.fn();
  });

  it('renders the popover when isOpen is true', () => {
    render(
      <Provider store={store}>
        <ConnectedSitePopover
          isOpen
          isConnected={false}
          onClick={jest.fn()}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    expect(screen.getByTestId('connected-site-popover')).toBeInTheDocument();
  });

  it('displays site name correctly', () => {
    render(
      <Provider store={store}>
        <ConnectedSitePopover
          isOpen
          isConnected={false}
          onClick={jest.fn()}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    expect(screen.getByText(/statusNotConnected/i)).toBeInTheDocument();
  });

  it('shows network name when connected', () => {
    render(
      <Provider store={store}>
        <ConnectedSitePopover
          isOpen
          isConnected={true}
          onClick={jest.fn()}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    expect(screen.getByText('Ethereum Mainnet')).toBeInTheDocument();
  });

  it('triggers onClick when manage permissions button is clicked', () => {
    const onClickMock = jest.fn();
    render(
      <Provider store={store}>
        <ConnectedSitePopover
          isOpen
          isConnected={true}
          onClick={onClickMock}
          onClose={jest.fn()}
        />
      </Provider>,
    );
    fireEvent.click(screen.getByText(/managePermissions/i));
    expect(onClickMock).toHaveBeenCalled();
  });
});
