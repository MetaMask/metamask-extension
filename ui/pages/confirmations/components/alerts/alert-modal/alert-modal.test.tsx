import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { AlertModal } from './alert-modal';

describe('AlertModal', () => {
  const ownerIdMock = '123';
  const handleButtonClickMock = jest.fn();
  const onCloseMock = jest.fn();
  const fromAlertKeyMock = 'from';
  const alertsMock = [
    {
      key: fromAlertKeyMock,
      severity: Severity.Warning,
      message: 'Alert 1',
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
    },
    { key: 'data', severity: Severity.Danger, message: 'Alert 2' },
  ];

  const mockState = {
    confirmAlerts: {
      alerts: { [ownerIdMock]: alertsMock },
      confirmed: { [ownerIdMock]: { [fromAlertKeyMock]: false, data: false } },
    },
  };
  const mockStore = configureMockStore([])(mockState);

  it('renders the alert modal', () => {
    const { container } = renderWithProvider(
      <AlertModal
        ownerId={ownerIdMock}
        handleButtonClick={handleButtonClickMock}
        onClose={onCloseMock}
        alertKey={fromAlertKeyMock}
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('disables button when alerts are not acknowledge', () => {
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={ownerIdMock}
        handleButtonClick={handleButtonClickMock}
        onClose={onCloseMock}
        alertKey={fromAlertKeyMock}
      />,
      mockStore,
    );

    expect(getByTestId('alert-modal-button')).toBeDisabled();
  });

  it('calls handleButtonClick when the button is clicked', () => {
    const mockStoreAcknowledgeAlerts = configureMockStore([])({
      ...mockState,
      confirmAlerts: {
        alerts: { [ownerIdMock]: alertsMock },
        confirmed: { [ownerIdMock]: { from: true, data: true } },
      },
    });
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={ownerIdMock}
        handleButtonClick={handleButtonClickMock}
        onClose={onCloseMock}
        alertKey={fromAlertKeyMock}
      />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));
    expect(handleButtonClickMock).toHaveBeenCalledTimes(1);
  });

  it('calls custom button', () => {
    const customButton = {
      label: 'Custom Button',
      onClick: jest.fn(),
    };
    const { getByText } = renderWithProvider(
      <AlertModal
        ownerId={ownerIdMock}
        handleButtonClick={handleButtonClickMock}
        onClose={onCloseMock}
        alertKey={fromAlertKeyMock}
        customButton={customButton}
      />,
      mockStore,
    );

    fireEvent.click(getByText(customButton.label));
    expect(customButton.onClick).toBeCalledTimes(1);
  });
});
