import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import * as MetametricsHooks from '../../../../hooks/metamask-notifications/useMetametrics';
import MetametricsToggle from './metametrics-toggle';

let mockUseSelectorReturnValue = false;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(() => mockUseSelectorReturnValue),
}));

const mockStore = configureMockStore();
const initialState = {
  metamask: {
    isSignedIn: false,
  },
};
const store = mockStore(initialState);

describe('MetametricsToggle', () => {
  const enableMetametricsMock = jest.fn(() => Promise.resolve());
  const disableMetametricsMock = jest.fn(() => Promise.resolve());

  beforeEach(() => {
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
    jest.spyOn(store, 'dispatch').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    mockUseSelectorReturnValue = false;
    const { getByTestId } = render(
      <Provider store={store}>
        <MetametricsToggle
          dataCollectionForMarketing={false}
          // eslint-disable-next-line no-empty-function
          setDataCollectionForMarketing={() => {}}
        />
      </Provider>,
    );
    expect(getByTestId('profileSyncToggle')).toBeInTheDocument();
  });

  it('calls enableMetametrics when toggle is turned on and profile syncing is disabled', () => {
    mockUseSelectorReturnValue = false;
    const { getByTestId } = render(
      <Provider store={store}>
        <MetametricsToggle
          dataCollectionForMarketing={false}
          // eslint-disable-next-line no-empty-function
          setDataCollectionForMarketing={() => {}}
        />
      </Provider>,
    );
    fireEvent.click(getByTestId('toggleButton'));
    expect(enableMetametricsMock).toHaveBeenCalled();
  });

  it('calls disableMetametrics when toggle is turned off and profile syncing is enabled', () => {
    mockUseSelectorReturnValue = true;
    const { getByTestId } = render(
      <Provider store={store}>
        <MetametricsToggle
          dataCollectionForMarketing={false}
          // eslint-disable-next-line no-empty-function
          setDataCollectionForMarketing={() => {}}
        />
      </Provider>,
    );
    fireEvent.click(getByTestId('toggleButton'));
    expect(disableMetametricsMock).toHaveBeenCalled();
  });
});
