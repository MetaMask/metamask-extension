import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import * as MetametricsHooks from '../../../hooks/useMetametrics';
import MetametricsToggle from './metametrics-toggle';

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

const enableMetametricsMock = jest.fn(() => Promise.resolve());
const disableMetametricsMock = jest.fn(() => Promise.resolve());

type StateOverrides = {
  isSignedIn?: boolean;
  useExternalServices?: boolean;
  completedMetaMetricsOnboarding?: boolean;
  optedIn?: boolean;
  isBackupAndSyncEnabled?: boolean;
};

const initialState: StateOverrides = {
  isSignedIn: true,
  useExternalServices: true,
  completedMetaMetricsOnboarding: true,
  optedIn: true,
  isBackupAndSyncEnabled: true,
};

const arrangeMocks = (stateOverrides: StateOverrides = {}) => {
  jest.clearAllMocks();

  const mockStore = configureMockStore();

  const store = mockStore({
    metamask: {
      ...initialState,
      ...stateOverrides,
    },
  });

  jest.spyOn(store, 'dispatch').mockImplementation(jest.fn());

  jest.spyOn(MetametricsHooks, 'useEnableMetametrics').mockReturnValue({
    enableMetametrics: enableMetametricsMock,
    loading: false,
    error: null,
  });
  jest.spyOn(MetametricsHooks, 'useDisableMetametrics').mockReturnValue({
    disableMetametrics: disableMetametricsMock,
    loading: false,
    error: null,
  });

  const PARTICIPATE_IN_METRICS_CONTAINER_TEST_ID =
    'participate-in-meta-metrics-container';
  const PARTICIPATE_IN_METRICS_TOGGLE_TEST_ID =
    'participate-in-meta-metrics-toggle';

  const { getByTestId } = render(
    <Provider store={store}>
      <MetametricsToggle
        dataCollectionForMarketing={false}
        setDataCollectionForMarketing={() => Promise.resolve()}
      />
    </Provider>,
  );

  const metaMetricsContainer = getByTestId(
    PARTICIPATE_IN_METRICS_CONTAINER_TEST_ID,
  );
  const metaMetricsToggleButton = getByTestId(
    PARTICIPATE_IN_METRICS_TOGGLE_TEST_ID,
  ).querySelector('input') as HTMLInputElement;

  return {
    metaMetricsContainer,
    metaMetricsToggleButton,
  };
};

describe('MetametricsToggle', () => {
  it('renders correctly', () => {
    const { metaMetricsContainer, metaMetricsToggleButton } = arrangeMocks();
    expect(metaMetricsContainer).toBeInTheDocument();
    expect(metaMetricsToggleButton).toBeInTheDocument();
  });

  it('is disabled when basic functionality is disabled', () => {
    const { metaMetricsToggleButton } = arrangeMocks({
      useExternalServices: false,
    });

    fireEvent.click(metaMetricsToggleButton);
    expect(enableMetametricsMock).not.toHaveBeenCalled();
  });

  it('tracks the enabled preference after enabling metrics', async () => {
    const { metaMetricsToggleButton } = arrangeMocks({
      useExternalServices: true,
      completedMetaMetricsOnboarding: true,
      optedIn: false,
    });
    fireEvent.click(metaMetricsToggleButton);

    expect(enableMetametricsMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.TurnOnMetaMetrics,
        properties: {
          category: MetaMetricsEventCategory.Settings,
          isProfileSyncingEnabled: true,
          participateInMetaMetrics: false,
          location: 'Settings',
        },
        sensitiveProperties: {},
      });
    });
  });

  it('tracks the disabled preference when metrics are disabled', async () => {
    const { metaMetricsToggleButton } = arrangeMocks({
      useExternalServices: true,
      completedMetaMetricsOnboarding: true,
      optedIn: true,
    });

    fireEvent.click(metaMetricsToggleButton);

    await waitFor(() => {
      expect(disableMetametricsMock).toHaveBeenCalled();
    });
    expect(mockTrackEvent).toHaveBeenNthCalledWith(1, {
      name: MetaMetricsEventName.TurnOffMetaMetrics,
      properties: {
        category: MetaMetricsEventCategory.Settings,
        isProfileSyncingEnabled: true,
        participateInMetaMetrics: true,
      },
      sensitiveProperties: {},
    });
    expect(mockTrackEvent).toHaveBeenNthCalledWith(2, {
      name: MetaMetricsEventName.AnalyticsPreferenceSelected,
      properties: {
        category: MetaMetricsEventCategory.Settings,
        [MetaMetricsUserTrait.IsMetricsOptedIn]: false,
        [MetaMetricsUserTrait.HasMarketingConsent]: false,
        location: 'Settings',
      },
      sensitiveProperties: {},
    });
  });
});
