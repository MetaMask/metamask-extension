import React from 'react';
import configureStore from 'redux-mock-store';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { I18nContext } from '../../../../../contexts/i18n';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import OriginThrottleModal from './origin-throttle-modal';

const mockHideModal = jest.fn();
jest.mock('../../../../../hooks/useModalProps', () => ({
  useModalProps: () => ({
    hideModal: mockHideModal,
  }),
}));

jest.mock('../../../hooks/useOriginThrottling');

const renderComponent = (isOpen: boolean, onConfirmationCancel: jest.Mock) => {
  const store = configureStore()(mockState);
  const t = (key: string) => key;
  return renderWithProvider(
    <I18nContext.Provider value={t}>
      <OriginThrottleModal
        isOpen={isOpen}
        onConfirmationCancel={onConfirmationCancel}
      />
    </I18nContext.Provider>,
    store,
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

    expect(onConfirmationCancel).toHaveBeenCalledWith({
      location: MetaMetricsEventLocation.OriginThrottleModal,
    });
    expect(mockResetOrigin).toHaveBeenCalled();
  });

  it('calls onConfirmationCancel on submit in OriginBlockedContent', () => {
    const onConfirmationCancel = jest.fn();
    renderComponent(true, onConfirmationCancel);

    // Simulate clicking the temporary block button
    fireEvent.click(screen.getByText('spamModalTemporaryBlockButton'));

    fireEvent.click(screen.getByText('gotIt'));

    expect(onConfirmationCancel).toHaveBeenCalledWith({
      location: MetaMetricsEventLocation.OriginThrottleModal,
    });
  });
});
