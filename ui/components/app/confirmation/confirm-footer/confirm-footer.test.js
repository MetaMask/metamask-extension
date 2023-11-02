import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Footer from '.';

describe('Footer', () => {
  const props = {
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
  };

  it('renders the correct text', () => {
    const { getByText } = render(<Footer {...props} />);
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('calls the correct function when Confirm is clicked', () => {
    const { getByText } = render(<Footer {...props} />);
    fireEvent.click(getByText('Confirm'));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('calls the correct function when Cancel is clicked', () => {
    const { getByText } = render(<Footer {...props} />);
    getByText('Cancel').click();
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('renders correct text and fires events when text is specified in props', () => {
    const overrideTextProps = {
      ...props,
      cancelText: 'Close',
      confirmText: 'Submit',
    };

    const { getByText } = render(<Footer {...overrideTextProps} />);
    expect(getByText('Submit')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();

    getByText('Close').click();
    expect(props.onCancel).toHaveBeenCalled();

    fireEvent.click(getByText('Submit'));
    expect(props.onConfirm).toHaveBeenCalled();
  });
});
