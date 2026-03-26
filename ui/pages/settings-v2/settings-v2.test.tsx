import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  ASSETS_ROUTE,
  CURRENCY_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_V2_ROUTE,
} from '../../helpers/constants/routes';
import SettingsV2 from './settings-v2';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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
  });

  describe('navigation', () => {
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
