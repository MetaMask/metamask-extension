import React from 'react';
import { render } from '@testing-library/react';
import { Content } from '.';

describe('Content', () => {
  it('renders children', () => {
    const { getByText } = render(<Content>Page content</Content>);
    expect(getByText('Page content')).toBeInTheDocument();
  });

  it('applies the multichain-page-content class', () => {
    const { container } = render(<Content>content</Content>);
    expect(container.firstChild).toHaveClass('multichain-page-content');
  });

  it('applies flex, w-full, and h-full layout classes', () => {
    const { container } = render(<Content>content</Content>);
    // flex is added automatically by MMDS Box when flexDirection is set
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('w-full');
    expect(container.firstChild).toHaveClass('h-full');
  });

  it('merges an additional className alongside the default classes', () => {
    const { container } = render(
      <Content className="extra-class">content</Content>,
    );
    expect(container.firstChild).toHaveClass('extra-class');
    expect(container.firstChild).toHaveClass('multichain-page-content');
  });
});
