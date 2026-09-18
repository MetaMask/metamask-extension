import React from 'react';
import { render } from '@testing-library/react';
import Receive from './receive-icon.component';

describe('Receive Icon Component', () => {
  const defaultProps = {
    size: 24,
    color: '#000000',
  };

  it('renders without crashing', () => {
    const { container } = render(<Receive {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size to svg width and height', () => {
    const { container } = render(<Receive {...defaultProps} size={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies color to stroke and fill elements', () => {
    const { container } = render(<Receive {...defaultProps} color="#ff0000" />);
    const svg = container.querySelector('svg');
    const strokeElement = svg?.querySelector('[stroke="#ff0000"]');
    const fillElement = svg?.querySelector('[fill="#ff0000"]');
    expect(strokeElement).toBeInTheDocument();
    expect(fillElement).toBeInTheDocument();
  });

  it('applies className when provided', () => {
    const { container } = render(
      <Receive {...defaultProps} className="custom-class" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<Receive {...defaultProps} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('class');
  });
});
