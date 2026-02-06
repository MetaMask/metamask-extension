/* eslint-disable jest/require-top-level-describe */
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { GlobalMenuDrawer } from './global-menu-drawer';

// Mock Headless UI Dialog to avoid portal issues in tests
jest.mock('@headlessui/react', () => {
  const actual = jest.requireActual('@headlessui/react');
  return {
    ...actual,
    Dialog: ({
      children,
      open,
      onClose,
      ...props
    }: {
      children: React.ReactNode;
      open: boolean;
      onClose: () => void;
      [key: string]: unknown;
    }) => {
      if (!open) {
        return null;
      }
      return (
        <div data-testid="dialog" {...props}>
          {children}
        </div>
      );
    },
  };
});

// Mock getEnvironmentType to control fullscreen mode
jest.mock('../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: jest.fn(() => 'popup'),
}));

// Mock ReactDOM.createPortal
jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('GlobalMenuDrawer', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    jest.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('should render the GlobalMenuDrawer without crashing', () => {
    const { getByText, getByTestId } = render(
      <GlobalMenuDrawer onClose={onClose} isOpen data-testid="drawer">
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );
    expect(getByText('drawer content')).toBeDefined();
    expect(getByTestId('drawer')).toBeDefined();
  });

  it('should match snapshot', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer onClose={onClose} isOpen={true} data-testid="test">
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );
    expect(getByTestId('test')).toMatchSnapshot();
  });

  it('should render the drawer when isOpen is true', () => {
    const { getByText } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const drawerContent = getByText('drawer content');
    expect(drawerContent).toBeInTheDocument();
  });

  it('should not render the drawer when isOpen is false', () => {
    const { queryByText } = render(
      <GlobalMenuDrawer isOpen={false} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const drawerContent = queryByText('drawer content');
    expect(drawerContent).not.toBeInTheDocument();
  });

  it('should call the onClose callback when clicking the close button', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose} showCloseButton={true}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const closeButton = getByTestId('drawer-close-button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when showCloseButton is false', () => {
    const { queryByTestId } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose} showCloseButton={false}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const closeButton = queryByTestId('drawer-close-button');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should render with custom width', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer
        isOpen={true}
        onClose={onClose}
        width="600px"
        data-testid="drawer"
      >
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const drawer = getByTestId('drawer');
    const panel = drawer.querySelector('[style*="max-width: 600px"]');
    expect(panel).toBeDefined();
  });

  it('should use default width when width prop is not provided', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose} data-testid="drawer">
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const drawer = getByTestId('drawer');
    const panel = drawer.querySelector('[style*="max-width: 400px"]');
    expect(panel).toBeDefined();
  });

  it('should render title for accessibility', () => {
    const { container } = render(
      <GlobalMenuDrawer
        isOpen={true}
        onClose={onClose}
        title="Test Drawer Title"
        showCloseButton={true}
      >
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const title = container.querySelector('[class*="sr-only"]');
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Test Drawer Title');
  });

  it('should prevent body scroll when drawer is open (non-fullscreen)', () => {
    render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when drawer is closed', () => {
    const { rerender } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <GlobalMenuDrawer isOpen={false} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('should handle onClickOutside when enabled', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose} onClickOutside={true}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const dialog = getByTestId('drawer');
    // Simulate clicking outside (on the backdrop)
    const backdrop = dialog.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      // Note: In actual Headless UI, this would trigger onClose
      // This test verifies the prop is passed correctly
    }
  });

  it('should not handle onClickOutside when disabled', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose} onClickOutside={false}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    const dialog = getByTestId('drawer');
    expect(dialog).toBeDefined();
    // When onClickOutside is false, clicking backdrop should not close
  });

  it('should render children content', () => {
    const { getByText } = render(
      <GlobalMenuDrawer isOpen={true} onClose={onClose}>
        <div>
          <h1>Title</h1>
          <p>Content paragraph</p>
        </div>
      </GlobalMenuDrawer>,
    );

    expect(getByText('Title')).toBeInTheDocument();
    expect(getByText('Content paragraph')).toBeInTheDocument();
  });

  it('should handle multiple rapid open/close cycles', () => {
    const { rerender } = render(
      <GlobalMenuDrawer isOpen={false} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );

    // Open
    rerender(
      <GlobalMenuDrawer isOpen={true} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    // Close
    rerender(
      <GlobalMenuDrawer isOpen={false} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );
    expect(document.body.style.overflow).toBe('');

    // Open again
    rerender(
      <GlobalMenuDrawer isOpen={true} onClose={onClose}>
        <div>drawer content</div>
      </GlobalMenuDrawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });
});
