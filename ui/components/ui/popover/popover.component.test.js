import React from 'react';
import { render, screen } from '@testing-library/react';
import PopoverPortal from './popover.component';

describe('PopoverPortal', () => {
  let popoverContentDiv;

  beforeEach(() => {
    // Create the popover-content div that PopoverPortal expects
    popoverContentDiv = document.createElement('div');
    popoverContentDiv.id = 'popover-content';
    document.body.appendChild(popoverContentDiv);
  });

  afterEach(() => {
    // Clean up
    if (popoverContentDiv && popoverContentDiv.parentNode) {
      popoverContentDiv.parentNode.removeChild(popoverContentDiv);
    }
  });

  it('renders popover content correctly', () => {
    render(
      <PopoverPortal title="Test Popover">
        <div data-testid="popover-child">Child Content</div>
      </PopoverPortal>,
    );

    // Verify content is rendered
    const childElement = screen.getByTestId('popover-child');
    expect(childElement).toBeInTheDocument();
  });

  it('renders popover directly when popover-content div does not exist', () => {
    // Remove the popover-content div
    document.body.removeChild(popoverContentDiv);
    popoverContentDiv = null;

    const { container } = render(
      <PopoverPortal title="Test Popover">
        <div data-testid="popover-child">Child Content</div>
      </PopoverPortal>,
    );

    // Verify content is rendered directly in container (fallback mode)
    expect(container.querySelector('[data-testid="popover-child"]')).toBeInTheDocument();
  });

  it('cleans up properly on unmount without throwing errors', () => {
    const { unmount } = render(
      <PopoverPortal title="Test Popover">
        <div data-testid="popover-child">Child Content</div>
      </PopoverPortal>,
    );

    // Unmount should not throw
    expect(() => unmount()).not.toThrow();
  });

  it('handles stale DOM references gracefully on unmount', () => {
    // Create a component instance
    const { unmount, rerender } = render(
      <PopoverPortal title="Test Popover">
        <div data-testid="popover-child">Child Content</div>
      </PopoverPortal>,
    );

    // Force a re-render to ensure componentDidMount has run
    rerender(
      <PopoverPortal title="Test Popover Updated">
        <div data-testid="popover-child">Child Content Updated</div>
      </PopoverPortal>,
    );

    // Spy on console.error to verify no errors are thrown
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Unmount should handle gracefully even if DOM is in unexpected state
    expect(() => unmount()).not.toThrow();

    // Verify no unhandled errors were logged (our error handling should catch them)
    const unexpectedErrors = consoleErrorSpy.mock.calls.filter(
      (call) => !call[0].includes('Error removing popover instance node:')
        && !call[0].includes('Error appending popover instance node:'),
    );
    expect(unexpectedErrors.length).toBe(0);

    consoleErrorSpy.mockRestore();
  });

  it('handles missing popover-content div during unmount gracefully', () => {
    const { unmount } = render(
      <PopoverPortal title="Test Popover">
        <div data-testid="popover-child">Child Content</div>
      </PopoverPortal>,
    );

    // Remove the popover-content div before unmounting
    // This simulates the scenario where Snow/LavaMoat has modified the DOM
    document.body.removeChild(popoverContentDiv);
    const originalDiv = popoverContentDiv;
    popoverContentDiv = null;

    // Unmount should handle this gracefully without throwing
    expect(() => unmount()).not.toThrow();

    // Restore for cleanup
    popoverContentDiv = originalDiv;
  });

  it('renders with title and children props', () => {
    render(
      <PopoverPortal title="Test Title">
        <div data-testid="child">Content</div>
      </PopoverPortal>,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders with close button when onClose prop is provided', () => {
    const handleClose = jest.fn();

    render(
      <PopoverPortal title="Test Title" onClose={handleClose}>
        <div>Content</div>
      </PopoverPortal>,
    );

    const closeButton = screen.getByTestId('popover-close');
    expect(closeButton).toBeInTheDocument();
  });

  it('uses fresh DOM reference lookup in componentWillUnmount', () => {
    const { unmount } = render(
      <PopoverPortal title="Test Popover">
        <div data-testid="popover-child">Child Content</div>
      </PopoverPortal>,
    );

    // Create a spy to verify getElementById is called during unmount
    // This ensures we're always getting a fresh reference, not using stale cached references
    const getElementByIdSpy = jest.spyOn(document, 'getElementById');

    // Unmount
    unmount();

    // Verify fresh lookup occurred
    expect(getElementByIdSpy).toHaveBeenCalledWith('popover-content');

    getElementByIdSpy.mockRestore();
  });
});
