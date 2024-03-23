import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import {
  MultipleAlertModal,
  MultipleAlertModalProps,
} from './multiple-alert-modal';

describe('MultipleAlertModal', () => {
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

  const defaultProps: MultipleAlertModalProps = {
    ownerId: ownerIdMock,
    handleButtonClick: handleButtonClickMock,
    alertKey: fromAlertKeyMock,
    onClose: onCloseMock,
  };

  it('renders the multiple alert modal', () => {
    const { container } = renderWithProvider(
      <MultipleAlertModal {...defaultProps} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
  describe('Navigation', () => {
    it('calls next alert when the next button is clicked', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <MultipleAlertModal {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-next-button'));

      expect(getByText(alertsMock[1].message)).toBeInTheDocument();
    });

    it('calls back alert when the back button is clicked', () => {
      const selectSecondAlertMock = { ...defaultProps, alertKey: 'data' };
      const { getByTestId, getByText } = renderWithProvider(
        <MultipleAlertModal {...selectSecondAlertMock} />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-back-button'));

      expect(getByText(alertsMock[0].message)).toBeInTheDocument();
    });
  });
});
