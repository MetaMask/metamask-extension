import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest';
import { AlertTypes } from '../../../../shared/constants/alerts';
import AlertsTab from '.';

const mockSetAlertEnabledness = jest.fn();

jest.mock('../../../store/actions', () => ({
  setAlertEnabledness: (...args) => mockSetAlertEnabledness(...args),
}));

describe('Alerts Tab', () => {
  const store = configureMockStore([])({
    metamask: {
      alertEnabledness: {
        unconnectedAccount: false,
        web3ShimUsage: false,
      },
    },
  });

  it('calls setAlertEnabledness with the correct params method when the toggles are clicked', () => {
    renderWithProvider(<AlertsTab />, store);

    expect(mockSetAlertEnabledness.mock.calls).toHaveLength(0);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(mockSetAlertEnabledness.mock.calls).toHaveLength(1);
    expect(mockSetAlertEnabledness.mock.calls[0][0]).toBe(
      AlertTypes.unconnectedAccount,
    );
    expect(mockSetAlertEnabledness.mock.calls[0][1]).toBe(true);

    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(mockSetAlertEnabledness.mock.calls).toHaveLength(2);
    expect(mockSetAlertEnabledness.mock.calls[1][0]).toBe(
      AlertTypes.web3ShimUsage,
    );
    expect(mockSetAlertEnabledness.mock.calls[1][1]).toBe(true);
  });
});
