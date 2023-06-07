import * as React from 'react';
import { render } from '@testing-library/react';
import SiteIcon from '.';

describe('SiteIcon', () => {
  const args = {
    size: 32,
    name: 'Snap name',
    icon: './images/eth_logo.png',
    className: 'classname-test',
    fallbackClassName: 'fallback-classname-test',
  };

  it('should render without crashing', () => {
    const { getByText } = render(<SiteIcon size={32} name={args.name} />);
    expect(getByText('S')).toBeDefined();
  });

  it('should render an icon image', () => {
    const { getByAltText } = render(<SiteIcon {...args} />);
    const image = getByAltText(args.name);
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.icon);
  });
});
