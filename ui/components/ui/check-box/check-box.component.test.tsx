import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import CheckBox, {
  CHECKED,
  INDETERMINATE,
  UNCHECKED,
} from './check-box.component';

describe('CheckBox Component', () => {
  it('renders with CHECKED state', () => {
    const { getByRole } = render(
      <CheckBox checked={CHECKED} onClick={jest.fn()} />,
    );
    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveClass('check-box__checked');
  });

  it('renders with UNCHECKED state', () => {
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={jest.fn()} />,
    );
    const checkbox = getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders with INDETERMINATE state', () => {
    const { getByRole } = render(
      <CheckBox checked={INDETERMINATE} onClick={jest.fn()} />,
    );
    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toHaveProperty('indeterminate', true);
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  });

  it('renders with boolean true for checked', () => {
    const { getByRole } = render(
      <CheckBox checked={true} onClick={jest.fn()} />,
    );
    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders with boolean false for checked', () => {
    const { getByRole } = render(
      <CheckBox checked={false} onClick={jest.fn()} />,
    );
    const checkbox = getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={mockOnClick} />,
    );
    fireEvent.click(getByRole('checkbox'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not propagate event when onClick is provided', () => {
    const mockOnClick = jest.fn();
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={mockOnClick} />,
    );
    const checkbox = getByRole('checkbox');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    fireEvent(checkbox, clickEvent);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('renders as disabled when disabled prop is true', () => {
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={jest.fn()} disabled />,
    );
    expect(getByRole('checkbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={jest.fn()} className="my-class" />,
    );
    expect(getByRole('checkbox')).toHaveClass('my-class');
  });

  it('renders with id when provided', () => {
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={jest.fn()} id="my-checkbox" />,
    );
    expect(getByRole('checkbox')).toHaveAttribute('id', 'my-checkbox');
  });

  it('renders with title when provided', () => {
    const { getByRole } = render(
      <CheckBox checked={UNCHECKED} onClick={jest.fn()} title="My Title" />,
    );
    expect(getByRole('checkbox')).toHaveAttribute('title', 'My Title');
  });

  it('renders with data-testid when dataTestId is provided', () => {
    const { getByTestId } = render(
      <CheckBox
        checked={UNCHECKED}
        onClick={jest.fn()}
        dataTestId="my-checkbox"
      />,
    );
    expect(getByTestId('my-checkbox')).toBeInTheDocument();
  });

  it('renders with null onClick handler when no onClick is provided', () => {
    const { getByRole } = render(<CheckBox checked={UNCHECKED} />);
    const checkbox = getByRole('checkbox');
    expect(() => fireEvent.click(checkbox)).not.toThrow();
  });
});
