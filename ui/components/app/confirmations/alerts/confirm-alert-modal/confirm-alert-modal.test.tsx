import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import {
  ConfirmAlertModalProps,
  ConfirmAlertModal,
} from './confirm-alert-modal';

describe('ConfirmAlertModal', () => {
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const onCloseMock = jest.fn();
  const onCancelMock = jest.fn();
  const onSubmitMock = jest.fn();
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

  const defaultProps: ConfirmAlertModalProps = {
    ownerId: OWNER_ID_MOCK,
    alertKey: FROM_ALERT_KEY_MOCK,
    onClose: onCloseMock,
    onCancel: onCancelMock,
    onSubmit: onSubmitMock,
  };

  it('renders the confirm alert modal', () => {
    const { getByText } = renderWithProvider(
      <ConfirmAlertModal {...defaultProps} />,
      mockStore,
    );

    expect(getByText('Your assets may be at risk')).toBeInTheDocument();
  });

  it('disables submit button when confirm modal is not acknowledged', () => {
    const { getByTestId } = renderWithProvider(
      <ConfirmAlertModal {...defaultProps} alertKey={'data'} />,
      mockStore,
    );

    expect(getByTestId('confirm-alert-modal-submit-button')).toBeDisabled();
  });

  it('calls onCancel when the button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ConfirmAlertModal {...defaultProps} />,
      mockStore,
    );

    fireEvent.click(getByTestId('confirm-alert-modal-cancel-button'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when the button is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ConfirmAlertModal {...defaultProps} />,
      mockStore,
    );

    fireEvent.click(getByTestId('alert-modal-acknowledge-checkbox'));
    fireEvent.click(getByTestId('confirm-alert-modal-submit-button'));
    expect(onSubmitMock).toHaveBeenCalledTimes(1);
  });

  it('calls open multiple alert modal when review alerts link is clicked', () => {
    const { getByTestId } = renderWithProvider(
      <ConfirmAlertModal {...defaultProps} />,
      mockStore,
    );

    fireEvent.click(getByTestId('confirm-alert-modal-review-all-alerts'));
    expect(getByTestId('alert-modal-button')).toBeInTheDocument();
  });
});
