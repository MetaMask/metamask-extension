import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import * as MetametricsHooks from '../../../../hooks/useMetametrics';
import MetametricsToggle from './metametrics-toggle';

const enableMetametricsMock = jest.fn(() => Promise.resolve());
const disableMetametricsMock = jest.fn(() => Promise.resolve());

type StateOverrides = {
  isSignedIn?: boolean;
  useExternalServices?: boolean;
  participateInMetaMetrics?: boolean;
  isBackupAndSyncEnabled?: boolean;
};

const initialState: StateOverrides = {
  isSignedIn: true,
  useExternalServices: true,
  participateInMetaMetrics: true,
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
        // eslint-disable-next-line no-empty-function
        setDataCollectionForMarketing={() => {}}
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

  it('calls enableMetametrics when toggle is turned on', () => {
    const { metaMetricsToggleButton } = arrangeMocks({
      useExternalServices: true,
      participateInMetaMetrics: false,
    });
    fireEvent.click(metaMetricsToggleButton);

    expect(enableMetametricsMock).toHaveBeenCalled();
  });

  it('calls disableMetametrics when toggle is turned off', () => {
    const { metaMetricsToggleButton } = arrangeMocks({
      useExternalServices: true,
      participateInMetaMetrics: true,
    });

    fireEvent.click(metaMetricsToggleButton);

    expect(disableMetametricsMock).toHaveBeenCalled();
  });
});
