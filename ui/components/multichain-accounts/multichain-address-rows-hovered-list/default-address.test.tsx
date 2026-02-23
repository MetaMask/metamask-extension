import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { DefaultAddress } from './default-address';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setShowDefaultAddress: (value: boolean) => ({
    type: 'SET_SHOW_DEFAULT_ADDRESS',
    value,
  }),
}));

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

const createMockMetaMetricsContext = (trackEvent = jest.fn()) => ({
  trackEvent,
  bufferedTrace: jest.fn().mockResolvedValue(undefined),
  bufferedEndTrace: jest.fn().mockResolvedValue(undefined),
  onboardingParentContext: { current: null },
});

describe('DefaultAddress', () => {
  it('renders the show default address label', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(screen.getByText('Show default address')).toBeInTheDocument();
  });

  it('renders the Change in Settings link', () => {
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

  it('tracks NavSettingsOpened when Change in Settings is clicked', () => {
    const mockTrackEvent = jest.fn();
    const store = mockStore(createMockState());
    renderWithProvider(
      <MetaMetricsContext.Provider
        value={createMockMetaMetricsContext(mockTrackEvent)}
      >
        <DefaultAddress />
      </MetaMetricsContext.Provider>,
      store,
    );

    fireEvent.click(screen.getByTestId('change-in-settings-link'));

    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.NavSettingsOpened,
      properties: {
        location: 'Account Hover Menu',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_type: 'show_default_address',
      },
    });
  });

  it('tracks SettingsUpdated when show default address toggle is clicked', () => {
    const mockTrackEvent = jest.fn();
    const store = mockStore(createMockState());
    renderWithProvider(
      <MetaMetricsContext.Provider
        value={createMockMetaMetricsContext(mockTrackEvent)}
      >
        <DefaultAddress />
      </MetaMetricsContext.Provider>,
      store,
    );

    fireEvent.click(screen.getByTestId('show-default-address-toggle'));

    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.SettingsUpdated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        default_address_network: 'eip155',
        location: 'Account Hover Menu',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        show_default_address: false,
      },
    });
  });
});
