import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  CURRENCY_ROUTE,
  DEFAULT_ROUTE,
  PREFERENCES_AND_DISPLAY_ROUTE,
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
      expect(
        await screen.findByText(messages.theme.message),
      ).toBeInTheDocument();
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
      expect(
        await screen.findByText(messages.theme.message),
      ).toBeInTheDocument();
    });

    it('detaches form controls that can be retained by non-delegated React listeners on unmount', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
      const storeWithDefaultAddress = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          remoteFeatureFlags: {
            ...mockState.metamask.remoteFeatureFlags,
            extensionUxDefaultAddressVersioned: true,
          },
        },
      });

      const { unmount } = renderSettings(storeWithDefaultAddress);
      const select = await screen.findByTestId(
        'default-address-scope-dropdown',
      );

      Object.defineProperty(select, '__reactFiber$test', {
        configurable: true,
        enumerable: true,
        value: {},
      });
      Object.defineProperty(select, '__reactProps$test', {
        configurable: true,
        enumerable: true,
        value: {},
      });

      unmount();

      expect(select.parentElement).toBeNull();
      expect('__reactFiber$test' in select).toBe(false);
      expect('__reactProps$test' in select).toBe(false);
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

      const backButton = await screen.findByTestId(
        'settings-header-back-button',
      );

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

      const backButton = await screen.findByTestId(
        'settings-header-back-button',
      );

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?drawerOpen=true`,
        );
      });
    });

    it('navigates to parent tab when back is clicked on a sub-page', async () => {
      mockPathname = CURRENCY_ROUTE;
      renderSettings(mockStore);

      const backButton = await screen.findByTestId(
        'settings-header-back-button',
      );

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          PREFERENCES_AND_DISPLAY_ROUTE,
        );
      });
    });
  });
});
