import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import type { SendAlert } from '../../../hooks/send/alerts/types';
import { SendAlertModal } from './send-alert-modal';

jest.mock('../../../../../hooks/useI18nContext');

const TOKEN_ALERT: SendAlert = {
  key: 'tokenContract',
  title: messages.smartContractAddress.message,
  message: 'This may result in fund loss.',
};

const FIRST_TIME_ALERT: SendAlert = {
  key: 'firstTimeInteraction',
  title: messages.sendAlertNewAddressTitle.message,
  message: 'You are sending for the first time.',
  acknowledgeButtonLabel: 'Continue',
};

describe('SendAlertModal', () => {
  const mockUseI18nContext = jest.mocked(useI18nContext);
  const mockStore = configureStore(mockState);

  const mockOnAcknowledge = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    alerts: [TOKEN_ALERT],
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
    mockUseI18nContext.mockReturnValue((key: string) => {
      if (key === 'ofTextNofM') {
        return 'of';
      }
      return key.toUpperCase();
    });
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

  it('returns null when alerts array is empty', () => {
    const { queryByTestId } = renderComponent({ alerts: [] });
    expect(queryByTestId('send-alert-modal-message')).not.toBeInTheDocument();
  });

  it('calls onAcknowledge when acknowledge button is clicked', () => {
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

  it('uses default "I understand" button label when none specified', () => {
    const { getByTestId } = renderComponent({ alerts: [TOKEN_ALERT] });

    expect(
      getByTestId('send-alert-modal-acknowledge-button'),
    ).toHaveTextContent('IUNDERSTAND');
  });

  it('uses custom acknowledge button label when specified', () => {
    const { getByTestId } = renderComponent({ alerts: [FIRST_TIME_ALERT] });

    expect(
      getByTestId('send-alert-modal-acknowledge-button'),
    ).toHaveTextContent('Continue');
  });

  describe('multi-alert navigation', () => {
    it('does not show navigation for single alert', () => {
      const { queryByTestId } = renderComponent({ alerts: [TOKEN_ALERT] });

      expect(
        queryByTestId('send-alert-modal-page-counter'),
      ).not.toBeInTheDocument();
      expect(
        queryByTestId('send-alert-modal-prev-button'),
      ).not.toBeInTheDocument();
      expect(
        queryByTestId('send-alert-modal-next-button'),
      ).not.toBeInTheDocument();
    });

    it('shows navigation for multiple alerts', () => {
      const { getByTestId, queryByTestId } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      expect(getByTestId('send-alert-modal-page-counter')).toHaveTextContent(
        '1 of 2',
      );
      expect(
        queryByTestId('send-alert-modal-prev-button'),
      ).not.toBeInTheDocument();
      expect(getByTestId('send-alert-modal-next-button')).toBeInTheDocument();
    });

    it('shows the first alert by default', () => {
      const { getByText, getByTestId } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      expect(
        getByText(messages.smartContractAddress.message),
      ).toBeInTheDocument();
      expect(getByTestId('send-alert-modal-message')).toHaveTextContent(
        'This may result in fund loss.',
      );
    });

    it('navigates to the next alert when next is clicked', () => {
      const { getByTestId, getByText } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      fireEvent.click(getByTestId('send-alert-modal-next-button'));

      expect(
        getByText(messages.sendAlertNewAddressTitle.message),
      ).toBeInTheDocument();
      expect(getByTestId('send-alert-modal-message')).toHaveTextContent(
        'You are sending for the first time.',
      );
      expect(getByTestId('send-alert-modal-page-counter')).toHaveTextContent(
        '2 of 2',
      );
    });

    it('navigates back to the previous alert', () => {
      const { getByTestId, getByText } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      fireEvent.click(getByTestId('send-alert-modal-next-button'));
      fireEvent.click(getByTestId('send-alert-modal-prev-button'));

      expect(
        getByText(messages.smartContractAddress.message),
      ).toBeInTheDocument();
      expect(getByTestId('send-alert-modal-page-counter')).toHaveTextContent(
        '1 of 2',
      );
    });

    it('does not render previous button on first alert', () => {
      const { queryByTestId } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      expect(
        queryByTestId('send-alert-modal-prev-button'),
      ).not.toBeInTheDocument();
    });

    it('does not render next button on last alert', () => {
      const { getByTestId, queryByTestId } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      fireEvent.click(getByTestId('send-alert-modal-next-button'));
      expect(
        queryByTestId('send-alert-modal-next-button'),
      ).not.toBeInTheDocument();
    });

    it('updates acknowledge button label per alert', () => {
      const { getByTestId } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      expect(
        getByTestId('send-alert-modal-acknowledge-button'),
      ).toHaveTextContent('IUNDERSTAND');

      fireEvent.click(getByTestId('send-alert-modal-next-button'));

      expect(
        getByTestId('send-alert-modal-acknowledge-button'),
      ).toHaveTextContent('Continue');
    });

    it('does not call onAcknowledge until the last alert is acknowledged', () => {
      const { getByTestId, getByText } = renderComponent({
        alerts: [TOKEN_ALERT, FIRST_TIME_ALERT],
      });

      fireEvent.click(getByTestId('send-alert-modal-acknowledge-button'));
      expect(mockOnAcknowledge).not.toHaveBeenCalled();
      expect(
        getByText(messages.sendAlertNewAddressTitle.message),
      ).toBeInTheDocument();

      fireEvent.click(getByTestId('send-alert-modal-acknowledge-button'));
      expect(mockOnAcknowledge).toHaveBeenCalledTimes(1);
    });
  });
});
