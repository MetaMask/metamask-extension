import { screen, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { I18nProvider, en } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import { LegacyMetaMetricsProvider } from '../../contexts/metametrics';
import {
  CURRENCY_ROUTE,
  SETTINGS_V2_ROUTE,
} from '../../helpers/constants/routes';
import SettingsV2 from './settings-v2';

let mockPathname = SETTINGS_V2_ROUTE;

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const renderSettingsV2 = (
  store: ReturnType<ReturnType<typeof configureMockStore>>,
) => {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[mockPathname]}>
        <I18nProvider currentLocale="en" current={en} en={en}>
          <LegacyMetaMetricsProvider>
            <SettingsV2 />
          </LegacyMetaMetricsProvider>
        </I18nProvider>
      </MemoryRouter>
    </Provider>,
  );
};

describe('SettingsV2', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    mockPathname = SETTINGS_V2_ROUTE;
  });

  describe('rendering at settings root', () => {
    it('renders the settings header', () => {
      renderSettingsV2(mockStore);

      expect(screen.getByText(messages.settings.message)).toBeInTheDocument();
    });

    it('renders the close button', () => {
      renderSettingsV2(mockStore);

      expect(
        screen.getByRole('button', { name: messages.close.message }),
      ).toBeInTheDocument();
    });

    it('renders the Assets tab', () => {
      renderSettingsV2(mockStore);

      const assetElements = screen.getAllByText(messages.assets.message);
      expect(assetElements.length).toBeGreaterThan(0);
    });
  });

  describe('rendering at currency route', () => {
    beforeEach(() => {
      mockPathname = CURRENCY_ROUTE;
    });

    it('displays Local currency subheader', () => {
      renderSettingsV2(mockStore);

      const localCurrencyTexts = screen.getAllByText(
        messages.localCurrency.message,
      );
      expect(localCurrencyTexts.length).toBeGreaterThan(0);
    });
  });
});
