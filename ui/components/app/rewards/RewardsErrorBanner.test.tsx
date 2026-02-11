import React, { Ref } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonProps } from '@metamask/design-system-react';
import RewardsErrorBanner from './RewardsErrorBanner';

// Partially mock the design-system Button to expose `isLoading` for assertions,
// while keeping other components unchanged.
jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const ReactLib = jest.requireActual('react');

  const MockButton = ReactLib.forwardRef(
    (
      { children, isLoading, onClick, ...rest }: ButtonProps,
      ref: Ref<HTMLButtonElement>,
    ) => (
      <button
        {...rest}
        // Provide a stable attribute to assert loading state
        data-loading={isLoading ? 'true' : 'false'}
        ref={ref}
        onClick={onClick}
      >
        {children}
      </button>
    ),
  );

  return {
    ...actual,
    Button: MockButton,
  };
});

describe('RewardsErrorBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and description', () => {
    render(
      <RewardsErrorBanner
        title="Error Title"
        description="Something went wrong"
      />,
    );

    expect(screen.getByTestId('rewards-error-banner')).toBeInTheDocument();
    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render action buttons when no handlers provided', () => {
    render(<RewardsErrorBanner title="T" description="D" />);
    // No buttons should be present if both onDismiss and onConfirm are undefined
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders Dismiss button and calls onDismiss when clicked', () => {
    const onDismiss = jest.fn();
    render(
      <RewardsErrorBanner title="T" description="D" onDismiss={onDismiss} />,
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders Confirm button with default label and calls onConfirm', () => {
    const onConfirm = jest.fn();
    render(
      <RewardsErrorBanner title="T" description="D" onConfirm={onConfirm} />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeInTheDocument();

    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders Confirm button with custom label when provided', () => {
    const onConfirm = jest.fn();
    render(
      <RewardsErrorBanner
        title="T"
        description="D"
        onConfirm={onConfirm}
        confirmButtonLabel="Proceed"
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Proceed' });
    expect(confirmButton).toBeInTheDocument();
  });

  it('sets loading state on Confirm button when onConfirmLoading is true', () => {
    const onConfirm = jest.fn();
    render(
      <RewardsErrorBanner
        title="T"
        description="D"
        onConfirm={onConfirm}
        onConfirmLoading
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeInTheDocument();
    // Assert the mocked Button exposes loading state via data-loading
    expect(confirmButton).toHaveAttribute('data-loading', 'true');
  });
});
