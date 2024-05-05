import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { AlertModal, FrictionModalConfig } from './alert-modal';

describe('AlertModal', () => {
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const ALERT_MESSAGE_MOCK = 'Alert 1';
  const onAcknowledgeClickMock = jest.fn();
  const onCloseMock = jest.fn();
  const alertsMock = [
    {
      key: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: ALERT_MESSAGE_MOCK,
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

  it('renders the alert modal', () => {
    const { getByText } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    expect(getByText(ALERT_MESSAGE_MOCK)).toBeInTheDocument();
  });

  it('disables button when alert is not acknowledged', () => {
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={'data'}
      />,
      mockStore,
    );

    expect(getByTestId('alert-modal-button')).toBeDisabled();
  });

  it('calls onAcknowledgeClick when the button is clicked', () => {
    const mockStoreAcknowledgeAlerts = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: alertsMock },
        confirmed: { [OWNER_ID_MOCK]: { from: true, data: true } },
      },
    });
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));
    expect(onAcknowledgeClickMock).toHaveBeenCalledTimes(1);
  });

  describe('friction Modal', () => {
    const onCancelMock = jest.fn();
    const onSubmitMock = jest.fn();
    const onFrictionLinkClickMock = jest.fn();
    const frictionModalConfig: FrictionModalConfig = {
      onAlertLinkClick: onFrictionLinkClickMock,
      onSubmit: onSubmitMock,
      onCancel: onCancelMock,
    };

    it('renders the alert modal with friction mode', () => {
      const { getByText } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={FROM_ALERT_KEY_MOCK}
          frictionModalConfig={frictionModalConfig}
        />,
        mockStore,
      );

      expect(getByText('Your assets may be at risk')).toBeInTheDocument();
    });

    it('disables submit button when friction modal is not acknowledged', () => {
      const { getByTestId } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={'data'}
          frictionModalConfig={frictionModalConfig}
        />,
        mockStore,
      );

      expect(getByTestId('alert-modal-submit-button')).toBeDisabled();
    });

    it('calls onCancel when the button is clicked', () => {
      const { getByTestId } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={FROM_ALERT_KEY_MOCK}
          frictionModalConfig={frictionModalConfig}
        />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-cancel-button'));
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });

    it('calls onSubmit when the button is clicked', () => {
      const { getByTestId } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={FROM_ALERT_KEY_MOCK}
          frictionModalConfig={frictionModalConfig}
        />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-acknowledge-checkbox'));
      fireEvent.click(getByTestId('alert-modal-submit-button'));
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });

    it('calls friction link when the link is clicked', () => {
      const { getByTestId } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={FROM_ALERT_KEY_MOCK}
          frictionModalConfig={frictionModalConfig}
        />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-review-all-alerts'));
      expect(onFrictionLinkClickMock).toHaveBeenCalledTimes(1);
    });
  });
});
