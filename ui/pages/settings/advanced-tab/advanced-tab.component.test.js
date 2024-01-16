import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import AdvancedTab from '.';

const mockSetAutoLockTimeLimit = jest.fn();
const mockSetShowTestNetworks = jest.fn();

jest.mock('../../../store/actions.ts', () => {
  return {
    setAutoLockTimeLimit: () => mockSetAutoLockTimeLimit,
    setShowTestNetworks: () => mockSetShowTestNetworks,
  };
});

describe('AdvancedTab Component', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<AdvancedTab />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('should render backup button', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const backupButton = queryByTestId('backup-button');
    expect(backupButton).toBeInTheDocument();
  });

  it('should render restore button', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const restoreFile = queryByTestId('restore-file');
    expect(restoreFile).toBeInTheDocument();
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

  it('should toggle show test networks', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const testNetworkToggle = queryAllByRole('checkbox')[2];

    fireEvent.click(testNetworkToggle);

    expect(mockSetShowTestNetworks).toHaveBeenCalled();
  });

  it('should not render ledger live control with desktop pairing enabled', () => {
    const mockStoreWithDesktopEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        desktopEnabled: true,
      },
    });

    const { queryByTestId } = renderWithProvider(
      <AdvancedTab />,
      mockStoreWithDesktopEnabled,
    );

    expect(queryByTestId('ledger-live-control')).not.toBeInTheDocument();
  });
});
