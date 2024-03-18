import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import SettingsTab from '.';
import 'jest-canvas-mock';

const mockSetCurrentCurrency = jest.fn();
const mockUpdateCurrentLocale = jest.fn();
const mockSetUseNativeCurrencyAsPrimaryCurrencyPreference = jest.fn();
const mockSetUseBlockie = jest.fn();
const mockSetHideZeroBalanceTokens = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setCurrentCurrency: () => mockSetCurrentCurrency,
  updateCurrentLocale: () => mockUpdateCurrentLocale,
  setUseNativeCurrencyAsPrimaryCurrencyPreference: () =>
    mockSetUseNativeCurrencyAsPrimaryCurrencyPreference,
  setUseBlockie: () => mockSetUseBlockie,
  setHideZeroBalanceTokens: () => mockSetHideZeroBalanceTokens,
}));

describe('Settings Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  afterEach(() => {
    mockSetCurrentCurrency.mockReset();
    mockUpdateCurrentLocale.mockReset();
    mockSetUseNativeCurrencyAsPrimaryCurrencyPreference.mockReset();
  });

  it('selects currency', async () => {
    const { queryByTestId } = renderWithProvider(<SettingsTab />, mockStore);

    fireEvent.change(queryByTestId('currency-select'), {
      target: { value: 'eur' },
    });

    expect(mockSetCurrentCurrency).toHaveBeenCalled();
  });

  it('selects locale', async () => {
    const { queryByTestId } = renderWithProvider(<SettingsTab />, mockStore);

    fireEvent.change(queryByTestId('locale-select'), {
      target: { value: 'ja' },
    });

    expect(mockUpdateCurrentLocale).toHaveBeenCalled();
  });

  it('clicks jazzicon', () => {
    const { queryByTestId } = renderWithProvider(<SettingsTab />, mockStore);

    const jazziconToggle = queryByTestId('jazz_icon');

    fireEvent.click(jazziconToggle);

    expect(mockSetUseBlockie).toHaveBeenCalled();
  });

  it('clicks blockies icon', () => {
    const { queryByTestId } = renderWithProvider(<SettingsTab />, mockStore);

    const blockieToggle = queryByTestId('blockie_icon');

    fireEvent.click(blockieToggle);

    expect(mockSetUseBlockie).toHaveBeenCalled();
  });

  it('toggles hiding zero balance', () => {
    const { getByRole } = renderWithProvider(<SettingsTab />, mockStore);

    const hideZerBalanceTokens = getByRole('checkbox');

    fireEvent.click(hideZerBalanceTokens);

    expect(mockSetHideZeroBalanceTokens).toHaveBeenCalled();
  });
});
