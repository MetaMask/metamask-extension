import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { BlockSize, IconColor } from '../../../helpers/constants/design-system';
import { Icon, IconName } from '../../component-library';
import IconButton from './icon-button';

describe('IconButton', () => {
  const mockOnClick = jest.fn();
  const testIcon = <Icon name={IconName.Add} color={IconColor.iconDefault} />;
  const defaultProps = {
    onClick: mockOnClick,
    Icon: testIcon,
    label: 'Test Button',
    className: 'test-class',
  };

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('applies disabled state correctly', () => {
    render(<IconButton {...defaultProps} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('handles click events when not disabled', () => {
    render(<IconButton {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders tooltip for long label', () => {
    render(
      <IconButton
        {...defaultProps}
        label="This is a very long button label that should trigger tooltip"
      />,
    );

    // Find the text inside a tooltip
    const tooltipText = screen.getByText(
      'This is a very long button label that should trigger tooltip',
    );
    expect(tooltipText).toBeInTheDocument();
  });

  it('passes through additional props to ButtonBase', () => {
    render(
      <IconButton
        {...defaultProps}
        width={BlockSize.Full}
        data-testid="custom-test-id"
      />,
    );

    const button = screen.getByTestId('custom-test-id');
    expect(button).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const { container } = render(
      <IconButton
        {...defaultProps}
        Icon={<div className="custom-icon">Icon</div>}
      />,
    );

    expect(container.querySelector('.custom-icon')).toBeInTheDocument();
  });
});
