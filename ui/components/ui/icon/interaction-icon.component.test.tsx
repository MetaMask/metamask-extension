import React from 'react';
import { render } from '@testing-library/react';
import Interaction from './interaction-icon.component';

describe('Interaction Icon Component', () => {
  const defaultProps = {
    size: 24,
    color: '#000000',
  };

  it('renders without crashing', () => {
    const { container } = render(<Interaction {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size to svg width and height', () => {
    const { container } = render(<Interaction {...defaultProps} size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies color to stroke and fill paths', () => {
    const { container } = render(
      <Interaction {...defaultProps} color="#ff0000" />,
    );
    const svg = container.querySelector('svg');
    const strokePath = svg?.querySelector('[stroke="#ff0000"]');
    const fillPath = svg?.querySelector('[fill="#ff0000"]');
    expect(strokePath).toBeInTheDocument();
    expect(fillPath).toBeInTheDocument();
  });

  it('applies className when provided', () => {
    const { container } = render(
      <Interaction {...defaultProps} className="custom-class" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<Interaction {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('class');
  });
});
