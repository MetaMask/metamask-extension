import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { SendAlertModal } from './send-alert-modal';

jest.mock('../../../../../hooks/useI18nContext');

describe('SendAlertModal', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockStore = configureStore(mockState);

  const mockOnAcknowledge = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    title: 'Smart contract address',
    errorMessage: 'This may result in fund loss.',
    onAcknowledge: mockOnAcknowledge,
    onClose: mockOnClose,
  };

  const renderComponent = (props = {}) => {
    return renderWithProvider(
      <SendAlertModal {...defaultProps} {...props} />,
      mockStore,
    );
  };

  beforeEach(() => {
    mockUseI18nContext.mockReturnValue((key: string) => key.toUpperCase());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with title and message when open', () => {
    const { getByText, getByTestId } = renderComponent();

    expect(
      getByText(messages.smartContractAddress.message),
    ).toBeInTheDocument();
    expect(getByTestId('send-alert-modal-message')).toHaveTextContent(
      'This may result in fund loss.',
    );
  });

  it('does not render modal content when closed', () => {
    const { queryByText } = renderComponent({ isOpen: false });

    expect(
      queryByText(messages.smartContractAddress.message),
    ).not.toBeInTheDocument();
  });

  it('calls onAcknowledge when I understand button is clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('send-alert-modal-acknowledge-button'));
    expect(mockOnAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('send-alert-modal-cancel-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close icon is clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('send-alert-modal-close-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders warning icon', () => {
    renderComponent();

    const icon = document.querySelector('.mm-icon');
    expect(icon).toBeInTheDocument();
  });
});
