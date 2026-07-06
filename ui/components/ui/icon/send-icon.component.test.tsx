import React from 'react';
import { render } from '@testing-library/react';
import Send from './send-icon.component';

describe('Send Icon Component', () => {
  const defaultProps = {
    size: 24,
    color: '#000000',
  };

  it('renders without crashing', () => {
    const { container } = render(<Send {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size to svg width and height', () => {
    const { container } = render(<Send {...defaultProps} size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies color to stroke and fill paths', () => {
    const { container } = render(<Send {...defaultProps} color="#ff0000" />);
    const svg = container.querySelector('svg');
    expect(svg?.querySelector('[stroke="#ff0000"]')).toBeInTheDocument();
    expect(svg?.querySelector('[fill="#ff0000"]')).toBeInTheDocument();
  });

  it('applies className when provided', () => {
    const { container } = render(
      <Send {...defaultProps} className="custom-class" />,
    );
    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<Send {...defaultProps} />);
    expect(container.querySelector('svg')).not.toHaveAttribute('class');
  });
});
