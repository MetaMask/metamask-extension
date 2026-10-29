import React from 'react';
import { render } from '@testing-library/react';
import Preloader from './preloader-icon.component';

describe('Preloader Icon Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Preloader size={16} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies size to svg width and height', () => {
    const { container } = render(<Preloader size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('applies the preloader icon class', () => {
    const { container } = render(<Preloader size={16} />);
    expect(container.querySelector('svg')).toHaveClass('preloader__icon');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <Preloader size={16} className="custom-class" />,
    );
    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });
});
