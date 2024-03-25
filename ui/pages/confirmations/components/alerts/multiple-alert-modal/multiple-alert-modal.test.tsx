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
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const handleButtonClickMock = jest.fn();
  const onCloseMock = jest.fn();
  const alertsMock = [
    {
      key: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: 'Alert 1',
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
    },
    { key: 'data', severity: Severity.Danger, message: 'Alert 2' },
  ];

  const STATE_MOCK = {
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: { [FROM_ALERT_KEY_MOCK]: false, data: false },
      },
    },
  };
  const mockStore = configureMockStore([])(STATE_MOCK);

  const defaultProps: MultipleAlertModalProps = {
    ownerId: OWNER_ID_MOCK,
    handleButtonClick: handleButtonClickMock,
    alertKey: FROM_ALERT_KEY_MOCK,
    onClose: onCloseMock,
  };

  it('renders the multiple alert modal', () => {
    const { getByTestId } = renderWithProvider(
      <MultipleAlertModal {...defaultProps} />,
      mockStore,
    );

    expect(getByTestId('alert-modal-next-button')).toBeDefined();
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
