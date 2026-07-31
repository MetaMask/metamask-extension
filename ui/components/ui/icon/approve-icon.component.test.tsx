import React from 'react';
import { render } from '@testing-library/react';
import Approve from './approve-icon.component';

describe('Approve Icon Component', () => {
  const defaultProps = {
    size: 24,
    color: '#000000',
  };

  it('renders without crashing', () => {
    const { container } = render(<Approve {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size to svg width and height', () => {
    const { container } = render(<Approve {...defaultProps} size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies color to stroke and fill paths', () => {
    const { container } = render(<Approve {...defaultProps} color="#ff0000" />);
    const svg = container.querySelector('svg');
    const strokePath = svg?.querySelector('[stroke="#ff0000"]');
    const fillPath = svg?.querySelector('[fill="#ff0000"]');
    expect(strokePath).toBeInTheDocument();
    expect(fillPath).toBeInTheDocument();
  });

  it('applies className when provided', () => {
    const { container } = render(
      <Approve {...defaultProps} className="custom-class" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<Approve {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('class');
  });
});
