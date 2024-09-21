import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import AdvancedTab from '.';

const mockSetAutoLockTimeLimit = jest.fn().mockReturnValue({ type: 'TYPE' });
const mockSetShowTestNetworks = jest.fn();
const mockSetShowFiatConversionOnTestnetsPreference = jest.fn();
const mockSetStxOptIn = jest.fn();

jest.mock('../../../store/actions.ts', () => {
  return {
    setAutoLockTimeLimit: (...args) => mockSetAutoLockTimeLimit(...args),
    setShowTestNetworks: () => mockSetShowTestNetworks,
    setShowFiatConversionOnTestnetsPreference: () =>
      mockSetShowFiatConversionOnTestnetsPreference,
    setSmartTransactionsOptInStatus: () => mockSetStxOptIn,
  };
});

describe('AdvancedTab Component', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<AdvancedTab />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should render export data button', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const exportDataButton = queryByTestId('export-data-button');
    expect(exportDataButton).toBeInTheDocument();
  });

  it('should default the auto-lockout time to 0', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');

    expect(autoLockoutTime).toHaveValue('0');
  });

  it('should update the auto-lockout time', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: '1440' } });

    expect(autoLockoutTime).toHaveValue('1440');

    fireEvent.click(autoLockoutButton);

    expect(mockSetAutoLockTimeLimit).toHaveBeenCalled();
  });

  it('should update the auto-lockout time to 0 if the input field is set to empty', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: '' } });

    expect(autoLockoutTime).toHaveValue('');

    fireEvent.click(autoLockoutButton);

    expect(mockSetAutoLockTimeLimit).toHaveBeenCalledWith(0);
  });

  it('should toggle show fiat on test networks', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const testShowFiatOnTestnets = queryAllByRole('checkbox')[2];

    fireEvent.click(testShowFiatOnTestnets);

    expect(mockSetShowFiatConversionOnTestnetsPreference).toHaveBeenCalled();
  });

  it('should toggle show test networks', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const testNetworkToggle = queryAllByRole('checkbox')[3];

    fireEvent.click(testNetworkToggle);

    expect(mockSetShowTestNetworks).toHaveBeenCalled();
  });

  describe('renderToggleStxOptIn', () => {
    it('should render the toggle button for Smart Transactions', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId('settings-page-stx-opt-in-toggle');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should call setSmartTransactionsOptInStatus when the toggle button is clicked', () => {
      const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
      const toggleButton = queryByTestId('settings-page-stx-opt-in-toggle');
      fireEvent.click(toggleButton);
      expect(mockSetStxOptIn).toHaveBeenCalled();
    });
  });
});
