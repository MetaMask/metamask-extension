import React from 'react';
import { render } from '@testing-library/react';
import { Footer } from '.';

describe('Footer', () => {
  it('renders children', () => {
    const { getByText } = render(<Footer>Footer content</Footer>);
    expect(getByText('Footer content')).toBeInTheDocument();
  });

  it('applies the multichain-page-footer class', () => {
    const { container } = render(<Footer>content</Footer>);
    expect(container.firstChild).toHaveClass('multichain-page-footer');
  });

  it('applies flex and w-full layout classes', () => {
    const { container } = render(<Footer>content</Footer>);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('merges an additional className alongside the default classes', () => {
    const { container } = render(
      <Footer className="custom-class">content</Footer>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('multichain-page-footer');
  });
});
