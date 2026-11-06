import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  CURRENCY_ROUTE,
  DEFAULT_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
  PREFERENCES_AND_DISPLAY_ROUTE,
  PRIVACY_ROUTE,
  SETTINGS_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import Settings from './settings';

const mockNavigate = jest.fn();
const mockGetEnvironmentType = jest.fn(() => ENVIRONMENT_TYPE_POPUP);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../shared/lib/environment-type'),
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

jest.mock(
  '../../components/app/shield-entry-modal/shield-illustration-animation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => <div data-testid="shield-illustration-animation" />,
  }),
);

// Resolve Privacy synchronously to exercise a settings tab present during the
// initial Strict Mode effect replay, as happens with an already-loaded chunk.
jest.mock('./settings-registry', () => {
  const actual = jest.requireActual('./settings-registry');
  const PrivacyTab = () => {
    const Component = jest.requireActual('./privacy-tab').default;
    return <Component />;
  };
  return {
    ...actual,
    SETTINGS_RENDERABLE_ROUTES: actual.SETTINGS_RENDERABLE_ROUTES.map(
      (route: { path: string; component: React.ComponentType }) =>
        route.path === '/settings/privacy'
          ? { ...route, component: PrivacyTab }
          : route,
    ),
  };
});

let mockPathname = SETTINGS_ROUTE;

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const renderSettings = (
  store: ReturnType<ReturnType<typeof configureMockStore>>,
) => {
  return renderWithProvider(<Settings />, store, mockPathname, render);
};

describe('Settings', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    mockPathname = SETTINGS_ROUTE;
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
  });

  it('keeps the Basic Functionality toggle interactive on direct entry in Strict Mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    const store = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useExternalServices: true,
        authConnection: undefined,
        firstTimeFlowType: 'create',
      },
    });
    renderWithProvider(
      <React.StrictMode>
        <Routes>
          <Route path="/settings/*" element={<Settings />} />
        </Routes>
      </React.StrictMode>,
      store,
      PRIVACY_ROUTE,
    );

    const input = screen.getByTestId('basic-functionality-toggle');
    expect(input).toBeInTheDocument();
    // Click the visible switch, which forwards the click to its hidden input.
    fireEvent.click(input.parentElement as HTMLElement);

    expect(store.getActions()).toContainEqual({
      type: 'SHOW_BASIC_FUNCTIONALITY_MODAL_OPEN',
    });
  });

  describe('navigation', () => {
    it('renders transaction shield on the settings root page', () => {
      renderSettings(mockStore);

      expect(
        screen.getByTestId('settings-root-item-transaction-shield'),
      ).toBeInTheDocument();
    });

    it('shows grouped tabs in fullscreen at the settings root', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

      renderSettings(mockStore);

      expect(
        screen.getByTestId('settings-tab-bar-grouped'),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.general.message)).toBeInTheDocument();
      expect(
        screen.getByTestId('settings-tab-item-transaction-shield'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('settings-root')).not.toBeInTheDocument();
      await screen.findByTestId('settings-tab-item-preferences-and-display');
      expect(
        screen.getByText(messages.securityAndPrivacy.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.transactionsAndAssets.message),
      ).toBeInTheDocument();
    });

    it('treats trailing-slash fullscreen settings route as the root route', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
      mockPathname = `${SETTINGS_ROUTE}/`;

      renderSettings(mockStore);

      expect(
        screen.getByTestId('settings-tab-bar-grouped'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('settings-root')).not.toBeInTheDocument();
      await screen.findByTestId('settings-tab-item-preferences-and-display');
    });

    it('navigates to transaction shield from the root page', async () => {
      renderSettings(mockStore);

      fireEvent.click(
        screen.getByTestId('settings-root-item-transaction-shield'),
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(TRANSACTION_SHIELD_ROUTE);
      });
    });

    it('navigates to home with the global menu drawer open when back is clicked at settings root', async () => {
      renderSettings(mockStore);

      const backButton = await screen.findByTestId('page-header-back-button');

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?drawerOpen=true`,
        );
      });
    });

    it('navigates to home with the drawer open when back is clicked at settings root regardless of settings URL query', async () => {
      mockPathname = `${SETTINGS_ROUTE}?drawerOpen=true`;
      renderSettings(mockStore);

      const backButton = await screen.findByTestId('page-header-back-button');

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?drawerOpen=true`,
        );
      });
    });

    it('navigates to parent tab without global-menu transition when back is clicked on a sub-page', async () => {
      mockPathname = CURRENCY_ROUTE;
      renderSettings(mockStore);

      const backButton = await screen.findByTestId('page-header-back-button');

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          PREFERENCES_AND_DISPLAY_ROUTE,
        );
      });
    });

    it('navigates from a notification section back to the main notifications settings page', async () => {
      mockPathname = NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE;
      renderSettings(mockStore);

      const backButton = await screen.findByTestId('page-header-back-button');

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(NOTIFICATIONS_SETTINGS_ROUTE);
      });
    });
  });
});
