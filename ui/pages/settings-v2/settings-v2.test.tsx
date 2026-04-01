import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  ASSETS_ROUTE,
  CURRENCY_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_V2_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import SettingsV2 from './settings-v2';

const mockNavigate = jest.fn();
const mockGetEnvironmentType = jest.fn(() => ENVIRONMENT_TYPE_POPUP);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../app/scripts/lib/util', () => ({
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

let mockPathname = SETTINGS_V2_ROUTE;

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const renderSettingsV2 = (
  store: ReturnType<ReturnType<typeof configureMockStore>>,
) => {
  return renderWithProvider(<SettingsV2 />, store, mockPathname, render);
};

describe('SettingsV2', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    mockPathname = SETTINGS_V2_ROUTE;
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
  });

  describe('navigation', () => {
    it('renders transaction shield on the settings root page', () => {
      renderSettingsV2(mockStore);

      expect(
        screen.getByTestId('settings-v2-root-item-transaction-shield'),
      ).toBeInTheDocument();
    });

    it('shows grouped tabs in fullscreen at the settings root', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

      renderSettingsV2(mockStore);

      expect(
        screen.getByTestId('settings-v2-tab-bar-grouped'),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.general.message)).toBeInTheDocument();
      expect(
        screen.getByTestId('settings-v2-tab-item-transaction-shield'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('settings-v2-root')).not.toBeInTheDocument();
      expect(
        await screen.findByText(messages.theme.message),
      ).toBeInTheDocument();
    });

    it('treats trailing-slash fullscreen settings route as the root route', async () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
      mockPathname = `${SETTINGS_V2_ROUTE}/`;

      renderSettingsV2(mockStore);

      expect(
        screen.getByTestId('settings-v2-tab-bar-grouped'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('settings-v2-root')).not.toBeInTheDocument();
      expect(
        await screen.findByText(messages.theme.message),
      ).toBeInTheDocument();
    });

    it('navigates to transaction shield from the root page', async () => {
      renderSettingsV2(mockStore);

      fireEvent.click(
        screen.getByTestId('settings-v2-root-item-transaction-shield'),
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(TRANSACTION_SHIELD_ROUTE);
      });
    });

    it('navigates to home when back is clicked at settings root', async () => {
      renderSettingsV2(mockStore);

      const backButton = await screen.findByTestId(
        'settings-v2-header-back-button',
      );

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });

    it('navigates to parent tab when back is clicked on a sub-page', async () => {
      mockPathname = CURRENCY_ROUTE;
      renderSettingsV2(mockStore);

      const backButton = await screen.findByTestId(
        'settings-v2-header-back-button',
      );

      fireEvent.click(backButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ASSETS_ROUTE);
      });
    });
  });
});
