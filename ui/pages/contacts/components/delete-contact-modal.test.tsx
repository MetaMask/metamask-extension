import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { DeleteContactModal } from './delete-contact-modal';

describe('DeleteContactModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when open', () => {
    it('renders the modal', () => {
      const { getByTestId } = renderWithProvider(
        <DeleteContactModal {...defaultProps} />,
      );
      expect(getByTestId('delete-contact-modal')).toBeInTheDocument();
    });

    it('renders title "Are you sure?"', () => {
      const { getByText } = renderWithProvider(
        <DeleteContactModal {...defaultProps} />,
      );
      expect(getByText(messages.areYouSure.message)).toBeInTheDocument();
    });

    it('renders body text "This contact will be deleted."', () => {
      const { getByText } = renderWithProvider(
        <DeleteContactModal {...defaultProps} />,
      );
      expect(
        getByText(messages.thisContactWillBeDeleted.message),
      ).toBeInTheDocument();
    });

    it('renders Delete confirm button', () => {
      const { getByTestId } = renderWithProvider(
        <DeleteContactModal {...defaultProps} />,
      );
      expect(getByTestId('delete-contact-confirm-button')).toBeInTheDocument();
    });

    it('calls onConfirm when Delete button is clicked', () => {
      const onConfirm = jest.fn();
      const { getByTestId } = renderWithProvider(
        <DeleteContactModal {...defaultProps} onConfirm={onConfirm} />,
      );
      fireEvent.click(getByTestId('delete-contact-confirm-button'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      const { getByLabelText } = renderWithProvider(
        <DeleteContactModal {...defaultProps} onClose={onClose} />,
      );
      const closeButton = getByLabelText(messages.close.message);
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('when closed', () => {
    it('does not render modal content when isOpen is false', () => {
      const { queryByTestId } = renderWithProvider(
        <DeleteContactModal {...defaultProps} isOpen={false} />,
      );
      expect(queryByTestId('delete-contact-modal')).not.toBeInTheDocument();
    });
  });
});
