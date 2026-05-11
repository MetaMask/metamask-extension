import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TextVariant } from '@metamask/design-system-react';
import { BatchSellInfoModal } from './BatchSellInfoModal';

const TITLE_PROPS = {
  variant: TextVariant.HeadingSm,
  children: 'Modal title',
};
const DESCRIPTION_PROPS = {
  variant: TextVariant.BodySm,
  children: 'Modal description',
};

const DEFAULT_MODAL_PROPS = {
  titleProps: TITLE_PROPS,
  descriptionProps: DESCRIPTION_PROPS,
};

describe('BatchSellInfoModal', () => {
  describe('when modalProps is undefined', () => {
    it('renders nothing', () => {
      const { container } = render(
        <BatchSellInfoModal open onClose={jest.fn()} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('when open=true and modalProps is provided', () => {
    it('renders the title and description', () => {
      const { getByText } = render(
        <BatchSellInfoModal
          open
          modalProps={DEFAULT_MODAL_PROPS}
          onClose={jest.fn()}
        />,
      );

      expect(getByText('Modal title')).toBeInTheDocument();
      expect(getByText('Modal description')).toBeInTheDocument();
    });

    it('calls onClose when the header close button is clicked', () => {
      const onClose = jest.fn();
      const { getByLabelText } = render(
        <BatchSellInfoModal
          open
          modalProps={DEFAULT_MODAL_PROPS}
          onClose={onClose}
        />,
      );

      fireEvent.click(getByLabelText('[close]'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = jest.fn();
      render(
        <BatchSellInfoModal
          open
          modalProps={DEFAULT_MODAL_PROPS}
          onClose={onClose}
        />,
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking outside the modal dialog', () => {
      const onClose = jest.fn();
      render(
        <BatchSellInfoModal
          open
          modalProps={DEFAULT_MODAL_PROPS}
          onClose={onClose}
        />,
      );

      fireEvent.mouseDown(document.body);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render the CTA footer when ctaProps is omitted', () => {
      const { queryByRole } = render(
        <BatchSellInfoModal
          open
          modalProps={DEFAULT_MODAL_PROPS}
          onClose={jest.fn()}
        />,
      );

      expect(queryByRole('button', { name: /sell/iu })).not.toBeInTheDocument();
    });
  });

  describe('when open=false', () => {
    it('does not display the modal content', () => {
      const { queryByText } = render(
        <BatchSellInfoModal
          open={false}
          modalProps={DEFAULT_MODAL_PROPS}
          onClose={jest.fn()}
        />,
      );

      expect(queryByText('Modal title')).not.toBeInTheDocument();
      expect(queryByText('Modal description')).not.toBeInTheDocument();
    });
  });

  describe('CTA button', () => {
    it('renders the CTA button with the provided text', () => {
      const { getByText } = render(
        <BatchSellInfoModal
          open
          modalProps={{
            ...DEFAULT_MODAL_PROPS,
            ctaProps: { text: 'Sell now', onClick: jest.fn() },
          }}
          onClose={jest.fn()}
        />,
      );

      expect(getByText('Sell now')).toBeInTheDocument();
    });

    it('calls ctaProps.onClick when the CTA button is clicked', () => {
      const onClick = jest.fn();
      const { getByText } = render(
        <BatchSellInfoModal
          open
          modalProps={{
            ...DEFAULT_MODAL_PROPS,
            ctaProps: { text: 'Sell now', onClick },
          }}
          onClose={jest.fn()}
        />,
      );

      fireEvent.click(getByText('Sell now'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
