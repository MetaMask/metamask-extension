import * as React from 'react';
import { render } from '@testing-library/react';
import IconWithFallback from '.';

describe('IconWithFallback', () => {
  const args = {
    name: 'Snap name',
    icon: './AST.png',
    className: 'classname-test',
    fallbackClassName: 'fallback-classname-test',
  };

  it('should render without crashing', () => {
    const { container } = render(<IconWithFallback />);
    expect(container.querySelector('span')).toBeDefined();
  });

  it('should render an icon image', () => {
    const { getByAltText } = render(<IconWithFallback {...args} />);
    const image = getByAltText(args.name);
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.icon);
  });

  it('should render with a fallback letter from the name prop', () => {
    const { getByText } = render(<IconWithFallback {...args} icon="" />);
    expect(getByText('S')).toBeDefined();
  });

  it('should render with a classname', () => {
    const { getByAltText } = render(<IconWithFallback {...args} />);
    expect(getByAltText(args.name)).toHaveClass(args.className);
  });

  it('should render with a fallback classname', () => {
    const { getByText } = render(<IconWithFallback {...args} icon="" />);
    expect(getByText('S')).toHaveClass(args.fallbackClassName);
  });
});
