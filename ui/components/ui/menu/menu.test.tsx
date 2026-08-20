import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { usePureBlack } from '@metamask/design-system-react';
import Menu from './menu';

jest.mock('react-popper', () => ({
  usePopper: jest.fn(() => ({
    attributes: { popper: {} },
    styles: { popper: {} },
  })),
}));

jest.mock('@metamask/design-system-react', () => ({
  usePureBlack: jest.fn(),
}));

const mockUsePureBlack = usePureBlack as jest.Mock;

describe('Menu Component', () => {
  let portalContainer: HTMLDivElement;

  beforeEach(() => {
    portalContainer = document.createElement('div');
    portalContainer.setAttribute('id', 'popover-content');
    document.body.appendChild(portalContainer);
    mockUsePureBlack.mockReturnValue(false);
  });

  afterEach(() => {
    document.body.removeChild(portalContainer);
  });

  const defaultProps = {
    onHide: jest.fn(),
    children: <div data-testid="menu-child">Menu Content</div>,
  } as React.ComponentProps<typeof Menu>;

  it('renders children in the portal', () => {
    const { getByTestId } = render(<Menu {...defaultProps} />);
    expect(getByTestId('menu-child')).toBeInTheDocument();
  });

  it('renders the backdrop element', () => {
    render(<Menu {...defaultProps} />);
    const backdrop = document.body.querySelector('.menu__background');
    expect(backdrop).toBeInTheDocument();
  });

  it('calls onHide when backdrop is clicked', () => {
    const mockOnHide = jest.fn();
    render(<Menu {...defaultProps} onHide={mockOnHide} />);
    const backdrop = document.body.querySelector('.menu__background');
    fireEvent.click(backdrop as Element);
    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it('renders the menu container with default class', () => {
    render(<Menu {...defaultProps} />);
    const menuContainer = document.body.querySelector('.menu__container');
    expect(menuContainer).toBeInTheDocument();
  });

  it('applies className to menu container', () => {
    render(<Menu {...defaultProps} className="custom-menu" />);
    const menuContainer = document.body.querySelector('.menu__container');
    expect(menuContainer).toHaveClass('custom-menu');
  });

  it('sets data-testid on backdrop when provided', () => {
    const { getByTestId } = render(
      <Menu {...defaultProps} data-testid="test-menu" />,
    );
    expect(getByTestId('test-menu')).toBeInTheDocument();
  });

  describe('pure black mode', () => {
    it('applies bg-section background and border-muted border when isPureBlack is true', () => {
      mockUsePureBlack.mockReturnValue(true);
      render(<Menu {...defaultProps} />);
      const menuContainer = document.body.querySelector(
        '.menu__container',
      ) as HTMLElement;
      expect(menuContainer).toHaveClass('bg-section');
      expect(menuContainer).toHaveClass('border');
      expect(menuContainer).toHaveClass('border-muted');
      expect(menuContainer).not.toHaveClass('bg-default');
    });

    it('applies bg-default and does not apply pure black styles when isPureBlack is false', () => {
      mockUsePureBlack.mockReturnValue(false);
      render(<Menu {...defaultProps} />);
      const menuContainer = document.body.querySelector(
        '.menu__container',
      ) as HTMLElement;
      expect(menuContainer).toHaveClass('bg-default');
      expect(menuContainer).not.toHaveClass('bg-section');
      expect(menuContainer).not.toHaveClass('border');
      expect(menuContainer).not.toHaveClass('border-muted');
    });
  });
});
