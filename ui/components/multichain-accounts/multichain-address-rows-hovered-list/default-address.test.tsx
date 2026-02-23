import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DefaultAddress } from './default-address';

const mockStore = configureStore([]);

const createMockState = (overrides = {}) => ({
  metamask: {
    preferences: {
      showDefaultAddress: true,
      defaultAddressScope: 'eip155',
      ...overrides,
    },
  },
});

describe('DefaultAddress', () => {
  it('renders the show default address label', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(screen.getByText('Show default address')).toBeInTheDocument();
  });

  it('renders the change in settings link', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(screen.getByTestId('change-in-settings-link')).toBeInTheDocument();
    expect(screen.getByText('Change in Settings')).toBeInTheDocument();
  });

  it('renders the show default address toggle', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(
      screen.getByTestId('show-default-address-toggle'),
    ).toBeInTheDocument();
  });
});
