import React from 'react';
import { render, screen } from '@testing-library/react';
import { DragHandleIcon } from './drag-handle-icon';

describe('DragHandleIcon', () => {
  it('renders SVG with default props', () => {
    render(<DragHandleIcon />);
    const svg = screen.getByTestId('drag-handle-icon-svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports custom size, class name, and color', () => {
    render(<DragHandleIcon size={24} className="custom-drag-icon" color="#ff0000" />);
    const svg = screen.getByTestId('drag-handle-icon-svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('fill', '#ff0000');
    expect(svg).toHaveClass('custom-drag-icon');
  });
});
