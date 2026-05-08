import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { TextVariant } from '@metamask/design-system-react';
import { BatchSellModal } from './BatchSellModal';

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

describe('BatchSellModal', () => {
  it('renders nothing when modalProps is undefined', () => {
    const { container } = render(<BatchSellModal open onClose={jest.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when open=true and modalProps is provided', () => {
    const { getByText } = render(
      <BatchSellModal
        open
        modalProps={DEFAULT_MODAL_PROPS}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('Modal title')).toBeInTheDocument();
    expect(getByText('Modal description')).toBeInTheDocument();
  });

  it('does not display modal content when open=false', () => {
    const { queryByText } = render(
      <BatchSellModal
        open={false}
        modalProps={DEFAULT_MODAL_PROPS}
        onClose={jest.fn()}
      />,
    );

    expect(queryByText('Modal title')).not.toBeInTheDocument();
    expect(queryByText('Modal description')).not.toBeInTheDocument();
  });

  it('calls onClose when the header close button is clicked', () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <BatchSellModal
        open
        modalProps={DEFAULT_MODAL_PROPS}
        onClose={onClose}
      />,
    );

    fireEvent.click(getByLabelText('[close]'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the CTA button with the provided text', () => {
    const onClick = jest.fn();
    const { getByText } = render(
      <BatchSellModal
        open
        modalProps={{
          ...DEFAULT_MODAL_PROPS,
          ctaProps: { text: 'Sell now', onClick },
        }}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('Sell now')).toBeInTheDocument();
  });

  it('calls ctaProps.onClick when the CTA button is clicked', () => {
    const onClick = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <BatchSellModal
        open
        modalProps={{
          ...DEFAULT_MODAL_PROPS,
          ctaProps: { text: 'Sell now', onClick },
        }}
        onClose={onClose}
      />,
    );

    fireEvent.click(getByText('Sell now'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the CTA button area without text when ctaProps is omitted', () => {
    const { queryByRole } = render(
      <BatchSellModal
        open
        modalProps={DEFAULT_MODAL_PROPS}
        onClose={jest.fn()}
      />,
    );

    // The button element is still rendered but its text node is empty
    const button = queryByRole('button', { name: /sell/iu });
    expect(button).not.toBeInTheDocument();
  });
});
