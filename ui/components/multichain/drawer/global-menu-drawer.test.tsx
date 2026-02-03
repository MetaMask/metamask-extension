import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '../../../../test/jest';
import { GlobalMenuDrawer } from '.';

const mockCloseMenu = jest.fn();

describe('GlobalMenuDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <GlobalMenuDrawer isOpen={false} closeMenu={mockCloseMenu} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders drawer when open', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu} />,
    );
    expect(getByTestId('global-menu-drawer')).toBeInTheDocument();
  });

  it('calls closeMenu when overlay is clicked', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu} />,
    );
    const overlay = getByTestId('global-menu-drawer-overlay');
    fireEvent.click(overlay);
    expect(mockCloseMenu).toHaveBeenCalledTimes(1);
  });

  it('calls closeMenu when close button is clicked', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu} />,
    );
    const closeButton = getByTestId('global-menu-drawer-close-button');
    fireEvent.click(closeButton);
    expect(mockCloseMenu).toHaveBeenCalledTimes(1);
  });

  it('calls closeMenu when Escape key is pressed', () => {
    render(<GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockCloseMenu).toHaveBeenCalledTimes(1);
  });

  it('does not call closeMenu when other keys are pressed', () => {
    render(<GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(mockCloseMenu).not.toHaveBeenCalled();
  });

  it('renders children when provided', () => {
    const { getByText } = render(
      <GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu}>
        <div>Test Content</div>
      </GlobalMenuDrawer>,
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with correct test ids', () => {
    const { getByTestId } = render(
      <GlobalMenuDrawer isOpen={true} closeMenu={mockCloseMenu} />,
    );
    expect(getByTestId('global-menu-drawer')).toBeInTheDocument();
    expect(getByTestId('global-menu-drawer-overlay')).toBeInTheDocument();
    expect(getByTestId('global-menu-drawer-close-button')).toBeInTheDocument();
  });
});
