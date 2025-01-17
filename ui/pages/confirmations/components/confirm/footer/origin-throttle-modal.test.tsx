import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { I18nContext } from '../../../../../contexts/i18n';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import OriginThrottleModal from './origin-throttle-modal';

const mockHideModal = jest.fn();
jest.mock('../../../../../hooks/useModalProps', () => ({
  useModalProps: () => ({
    hideModal: mockHideModal,
  }),
}));

jest.mock('../../../hooks/useOriginThrottling');

const renderComponent = (isOpen: boolean, onConfirmationCancel: jest.Mock) => {
  const t = (key: string) => key; // Mock translation function
  return render(
    <I18nContext.Provider value={t}>
      <OriginThrottleModal
        isOpen={isOpen}
        onConfirmationCancel={onConfirmationCancel}
      />
    </I18nContext.Provider>,
  );
};

describe('OriginThrottleModal', () => {
  const mockUseOriginThrottling = useOriginThrottling as jest.Mock;
  const mockResetOrigin = jest.fn();

  beforeEach(() => {
    mockUseOriginThrottling.mockReturnValue({
      resetOrigin: mockResetOrigin,
    });
  });

  it('renders MultipleRequestContent when isTemporaryBlock is false', () => {
    const onConfirmationCancel = jest.fn();
    renderComponent(true, onConfirmationCancel);

    expect(screen.getByText('spamModalTitle')).toBeInTheDocument();
    expect(screen.getByText('spamModalDescription')).toBeInTheDocument();
    expect(
      screen.getByText('spamModalTemporaryBlockButton'),
    ).toBeInTheDocument();
  });

  it('renders OriginBlockedContent when isTemporaryBlock is true', () => {
    const onConfirmationCancel = jest.fn();
    renderComponent(true, onConfirmationCancel);

    // Simulate clicking the temporary block button
    fireEvent.click(screen.getByText('spamModalTemporaryBlockButton'));

    expect(screen.getByText('spamModalBlockedTitle')).toBeInTheDocument();
    expect(screen.getByText('spamModalBlockedDescription')).toBeInTheDocument();
    expect(screen.getByText('gotIt')).toBeInTheDocument();
  });

  it('calls onConfirmationCancel and resetOrigin on submit in MultipleRequestContent', () => {
    const onConfirmationCancel = jest.fn();
    renderComponent(true, onConfirmationCancel);

    fireEvent.click(screen.getByText('cancel'));

    expect(onConfirmationCancel).toHaveBeenCalledWith(true);
    expect(mockResetOrigin).toHaveBeenCalled();
  });

  it('calls onConfirmationCancel on submit in OriginBlockedContent', () => {
    const onConfirmationCancel = jest.fn();
    renderComponent(true, onConfirmationCancel);

    // Simulate clicking the temporary block button
    fireEvent.click(screen.getByText('spamModalTemporaryBlockButton'));

    fireEvent.click(screen.getByText('gotIt'));

    expect(onConfirmationCancel).toHaveBeenCalledWith(true);
  });
});
