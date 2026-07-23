import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import { ThemeType } from '../../../../shared/constants/preferences';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import ThemeSubPage from './theme-sub-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSetTheme = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setTheme: (val: string) => {
    mockSetTheme(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const trackAnalyticsEventMock = jest.fn().mockResolvedValue(undefined);
const backgroundConnectionMock = new Proxy(
  {
    trackAnalyticsEvent: trackAnalyticsEventMock,
  },
  {
    get: (target, prop) =>
      prop in target
        ? target[prop as keyof typeof target]
        : jest.fn().mockResolvedValue(undefined),
  },
);

describe('ThemeSubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders theme options', () => {
    renderWithProvider(<ThemeSubPage />, mockStore);

    expect(screen.getByText(messages.lightTheme.message)).toBeInTheDocument();
    expect(screen.getByText(messages.darkTheme.message)).toBeInTheDocument();
    expect(screen.getByText(messages.osTheme.message)).toBeInTheDocument();
  });

  it('calls setTheme and navigates when a theme is clicked', () => {
    const storeWithDarkTheme = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        analyticsId: 'test-analytics-id',
        completedMetaMetricsOnboarding: true,
        optedIn: true,
        theme: ThemeType.dark,
      },
    });
    renderWithProvider(<ThemeSubPage />, storeWithDarkTheme);

    fireEvent.click(screen.getByText(messages.lightTheme.message));

    expect(mockSetTheme).toHaveBeenCalledWith(ThemeType.light);
    expect(trackAnalyticsEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ThemeChanged,
        properties: {
          category: MetaMetricsEventCategory.Settings,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          theme_selected: ThemeType.light,
        },
        sensitiveProperties: {},
      }),
      expect.objectContaining({
        environmentType: expect.any(String),
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith(PREFERENCES_AND_DISPLAY_ROUTE);
  });
});
