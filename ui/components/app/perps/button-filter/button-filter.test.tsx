import React from 'react';
import { fireEvent, screen, render } from '@testing-library/react';
import { ButtonFilter } from './button-filter';

describe('ButtonFilter', () => {
  it('renders with children content', () => {
    render(<ButtonFilter>Test Button</ButtonFilter>);

    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('applies active styling when isActive is true', () => {
    render(<ButtonFilter isActive>Active Button</ButtonFilter>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-icon-default');
    expect(button).toHaveClass('text-primary-inverse');
  });

  it('applies inactive styling when isActive is false', () => {
    render(<ButtonFilter isActive={false}>Inactive Button</ButtonFilter>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-background-muted');
    expect(button).toHaveClass('text-default');
  });

  it('applies inactive styling by default when isActive is not provided', () => {
    render(<ButtonFilter>Default Button</ButtonFilter>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-background-muted');
  });

  it('forwards click events', () => {
    const handleClick = jest.fn();
    render(<ButtonFilter onClick={handleClick}>Clickable Button</ButtonFilter>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('merges custom className with defaults', () => {
    render(<ButtonFilter className="custom-class">Custom Button</ButtonFilter>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('px-2');
    expect(button).toHaveClass('rounded-lg');
  });

  it('applies whitespace-nowrap class', () => {
    render(<ButtonFilter>No Wrap Button</ButtonFilter>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('whitespace-nowrap');
  });

  it('forwards additional props to ButtonBase', () => {
    render(
      <ButtonFilter data-testid="custom-filter-button">
        Button With Props
      </ButtonFilter>,
    );

    expect(screen.getByTestId('custom-filter-button')).toBeInTheDocument();
  });

  it('renders as disabled when disabled prop is passed', () => {
    render(<ButtonFilter disabled>Disabled Button</ButtonFilter>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
