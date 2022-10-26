/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AvatarFavicon } from './avatar-favicon';

describe('AvatarFavicon', () => {
  const args = {
    imageSource: './images/eth_logo.svg',
  };

  it('should render correctly', () => {
    const { getByTestId } = render(
      <AvatarFavicon data-testid="avatar-favicon" />,
    );
    expect(getByTestId('avatar-favicon')).toBeDefined();
  });

  it('should render image of Avatar Favicon', () => {
    render(<AvatarFavicon data-testid="avatar-favicon" {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.imageSource);
  });

  it('should render fallback image if no ImageSource is provided', () => {
    const { container } = render(
      <AvatarFavicon data-testid="avatar-favicon" />,
    );
    expect(container.getElementsByClassName('icon')).toHaveLength(1);
  });

  it('should render fallback image with custom fallbackIconProps if no ImageSource is provided', () => {
    const container = (
      <AvatarFavicon
        data-testid="avatar-favicon"
        fallbackIconProps={{
          'data-testid': 'fallback-icon',
        }}
      />
    );
    expect(container.props.fallbackIconProps['data-testid']).toStrictEqual(
      'fallback-icon',
    );
  });
});
