import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import ConfirmFooter from '.';

describe('ConfirmFooter', () => {
  const props = {
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
  };

  it('renders the correct text', () => {
    const { getByText } = render(<ConfirmFooter {...props} />);
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  it('calls the correct function when Confirm is clicked', () => {
    const { getByText } = render(<ConfirmFooter {...props} />);
    fireEvent.click(getByText('Confirm'));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('calls the correct function when Cancel is clicked', () => {
    const { getByText } = render(<ConfirmFooter {...props} />);
    getByText('Cancel').click();
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('renders correct text and fires events when text is specified in props', () => {
    const overrideTextProps = {
      ...props,
      cancelText: 'Close',
      confirmText: 'Submit',
    };

    const { getByText } = render(<ConfirmFooter {...overrideTextProps} />);
    expect(getByText('Submit')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();

    getByText('Close').click();
    expect(props.onCancel).toHaveBeenCalled();

    fireEvent.click(getByText('Submit'));
    expect(props.onConfirm).toHaveBeenCalled();
  });
});
