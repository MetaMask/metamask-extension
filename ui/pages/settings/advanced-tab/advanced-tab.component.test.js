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

  it('should update autoLockTimeLimit', () => {
    const { queryByTestId } = renderWithProvider(<AdvancedTab />, mockStore);
    const autoLockoutTime = queryByTestId('auto-lockout-time');
    const autoLockoutButton = queryByTestId('auto-lockout-button');

    fireEvent.change(autoLockoutTime, { target: { value: 1440 } });

    expect(autoLockoutTime).toHaveValue(1440);

    fireEvent.click(autoLockoutButton);

    expect(mockSetAutoLockTimeLimit).toHaveBeenCalled();
  });

  it('should toggle show test networks', () => {
    const { queryAllByRole } = renderWithProvider(<AdvancedTab />, mockStore);

    const testNetworkToggle = queryAllByRole('checkbox')[3];

    fireEvent.click(testNetworkToggle);

    expect(mockSetShowTestNetworks).toHaveBeenCalled();
  });
});
