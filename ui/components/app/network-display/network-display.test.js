import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import NetworkDisplay from './network-display';

const mockStore = configureStore([]);

describe.skip('NetworkDisplay', () => {
  it('renders the network display with the current network', () => {
    const store = mockStore({
      metamask: {
        network: {
          nickname: 'Test Network',
          rpcPrefs: {
            imageUrl: 'http://test.image.url',
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByTestId('network-display')).toBeInTheDocument();
  });

  it('renders the network display with no current network', () => {
    const store = mockStore({
      metamask: {
        network: null,
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.queryByText('Test Network')).toBeNull();
    expect(screen.queryByTestId('network-display')).toBeNull();
  });

  it('renders the network display with no image url', () => {
    const store = mockStore({
      metamask: {
        network: {
          nickname: 'Test Network',
          rpcPrefs: {
            imageUrl: null,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByTestId('network-display')).toBeInTheDocument();
  });

  it('renders the network display with no network', () => {
    const store = mockStore({
      metamask: {
        network: null,
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.queryByText('Test Network')).toBeNull();
    expect(screen.queryByTestId('network-display')).toBeNull();
  });

  it('renders the network display with no rpcPrefs', () => {
    const store = mockStore({
      metamask: {
        network: {
          nickname: 'Test Network',
          rpcPrefs: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.getByText('Test Network')).toBeInTheDocument();
    expect(screen.getByTestId('network-display')).toBeInTheDocument();
  });

  it('renders the network display with no nickname', () => {
    const store = mockStore({
      metamask: {
        network: {
          nickname: null,
          rpcPrefs: {
            imageUrl: 'http://test.image.url',
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.queryByText('Test Network')).toBeNull();
    expect(screen.queryByTestId('network-display')).toBeNull();
  });

  it('renders the network display with no nickname and no rpcPrefs', () => {
    const store = mockStore({
      metamask: {
        network: {
          nickname: null,
          rpcPrefs: null,
        },
      },
    });

    render(
      <Provider store={store}>
        <NetworkDisplay />
      </Provider>
    );

    expect(screen.queryByText('Test Network')).toBeNull();
    expect(screen.queryByTestId('network-display')).toBeNull();
  });
});
