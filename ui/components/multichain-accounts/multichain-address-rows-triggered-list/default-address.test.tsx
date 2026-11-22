import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the show default address label', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(
      screen.getByText(messages.showDefaultAddress.message),
    ).toBeInTheDocument();
  });

  it('renders the Change in Settings link', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(screen.getByTestId('change-in-settings-link')).toBeInTheDocument();
    expect(
      screen.getByText(messages.changeInSettings.message),
    ).toBeInTheDocument();
  });

  it('renders the show default address toggle', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    expect(
      screen.getByTestId('show-default-address-toggle'),
    ).toBeInTheDocument();
  });

  it('tracks NavSettingsOpened when Change in Settings is clicked', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    fireEvent.click(screen.getByTestId('change-in-settings-link'));

    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.NavSettingsOpened,
      properties: {
        category: MetaMetricsEventCategory.Navigation,
        location: 'Account Hover Menu',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_type: 'show_default_address',
      },
      sensitiveProperties: {},
    });
  });

  it('tracks SettingsUpdated when show default address toggle is clicked', () => {
    const store = mockStore(createMockState());
    renderWithProvider(<DefaultAddress />, store);

    fireEvent.click(screen.getByTestId('show-default-address-toggle'));

    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.SettingsUpdated,
      properties: {
        category: MetaMetricsEventCategory.Settings,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        default_address_network: 'eip155',
        location: 'Account Hover Menu',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        show_default_address: false,
      },
      sensitiveProperties: {},
    });
  });
});
