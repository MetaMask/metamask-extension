import React from 'react';
import configureMockStore from 'redux-mock-store';
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
});
