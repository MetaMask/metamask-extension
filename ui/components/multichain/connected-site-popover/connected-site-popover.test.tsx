import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { ConnectedSitePopover } from './connected-site-popover';
import { Store, AnyAction } from 'redux';

const mockStore = configureStore([]);
const store = configureStore({
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
  },
  activeTab: {
    id: 113,
    title: 'E2E Test Dapp',
    origin: 'https://metamask.github.io',
    protocol: 'https:',
    url: 'https://metamask.github.io/test-dapp/',
  },
});

describe('ConnectedSitePopover', () => {
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
    expect(screen.getByText('Goerli')).toBeInTheDocument();
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
