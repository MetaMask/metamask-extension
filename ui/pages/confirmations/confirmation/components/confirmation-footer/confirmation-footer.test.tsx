import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import * as AlertContext from '../../alerts/TemplateAlertContext';
import ConfirmationFooter from './confirmation-footer';

jest.mock('../../alerts/TemplateAlertContext', () => ({
  ...jest.requireActual('../../alerts/TemplateAlertContext'),
  useTemplateAlertContext: jest.fn().mockReturnValue({
    hasAlerts: false,
    showAlertsModal: jest.fn(),
  }),
}));

describe('ConfirmationFooter', () => {
  it('invoke prop onSubmit when confirm button is clicked if there are no alerts', () => {
    const mockSubmit = jest.fn();
    const { getByText } = render(
      <ConfirmationFooter onSubmit={mockSubmit} submitText="Confirm" />,
    );
    fireEvent.click(getByText('Confirm'));
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it('invoke showAlertsModal when confirm button is clicked if alerts are present', () => {
    const mockShowAlertsModal = jest.fn();
    jest.spyOn(AlertContext, 'useTemplateAlertContext').mockReturnValue({
      hasAlerts: true,
      showAlertsModal: mockShowAlertsModal,
    });
    const mockSubmit = jest.fn();
    const { getByText } = render(
      <ConfirmationFooter onSubmit={mockSubmit} submitText="Confirm" />,
    );
    fireEvent.click(getByText('Confirm'));
    expect(mockShowAlertsModal).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledTimes(0);
  });
});
