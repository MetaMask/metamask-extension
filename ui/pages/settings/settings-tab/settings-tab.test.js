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
const mockSetAvatarType = jest.fn();
const mockSetHideZeroBalanceTokens = jest.fn();
const mockSetShowNativeTokenAsMainBalance = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setCurrentCurrency: () => mockSetCurrentCurrency,
  updateCurrentLocale: () => mockUpdateCurrentLocale,
  setAvatarType: (value) => () => mockSetAvatarType(value),
  setHideZeroBalanceTokens: () => mockSetHideZeroBalanceTokens,
  setShowNativeTokenAsMainBalancePreference: () =>
    mockSetShowNativeTokenAsMainBalance,
}));

describe('Settings Tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  afterEach(() => {
    mockSetCurrentCurrency.mockReset();
    mockUpdateCurrentLocale.mockReset();
    mockSetAvatarType.mockReset();
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

    expect(mockSetAvatarType).toHaveBeenCalledWith('jazzicon');
  });

  it('clicks blockies icon', () => {
    const { queryByTestId } = renderWithProvider(<SettingsTab />, mockStore);
    const blockieToggle = queryByTestId('blockie_icon');

    fireEvent.click(blockieToggle);

    expect(mockSetAvatarType).toHaveBeenCalledWith('blockies');
  });

  it('clicks maskicon', () => {
    const { queryByTestId } = renderWithProvider(<SettingsTab />, mockStore);
    const maskiconToggle = queryByTestId('maskicon_icon');

    fireEvent.click(maskiconToggle);

    expect(mockSetAvatarType).toHaveBeenCalledWith('maskicon');
  });

  it('toggles hiding zero balance', () => {
    const { getAllByRole } = renderWithProvider(<SettingsTab />, mockStore);

    const allCheckBoxes = getAllByRole('checkbox');
    const hideZerBalanceTokens = allCheckBoxes[1];

    fireEvent.click(hideZerBalanceTokens);

    expect(mockSetHideZeroBalanceTokens).toHaveBeenCalled();
  });

  it('toggles showing native token as main balance', () => {
    const { getAllByRole } = renderWithProvider(<SettingsTab />, mockStore);

    const allCheckBoxes = getAllByRole('checkbox');
    const showNativeTokenAsMainBalance = allCheckBoxes[0];

    fireEvent.click(showNativeTokenAsMainBalance);

    expect(mockSetShowNativeTokenAsMainBalance).toHaveBeenCalled();
  });
});
