/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AvatarIcon } from './avatar-icon';

describe('AvatarIcon', () => {
  const args = {
    imageSource: './images/eth_logo.svg',
  };

  it('should render correctly', () => {
    const { getByTestId } = render(<AvatarIcon data-testid="avatar-icon" />);
    expect(getByTestId('avatar-icon')).toBeDefined();
  });

  it('should render image of Avatar Favicon', () => {
    render(<AvatarIcon data-testid="avatar-icon" {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.imageSource);
  });

  it('should render fallback image if no ImageSource is provided', () => {
    const { container } = render(<AvatarIcon data-testid="avatar-icon" />);
    expect(container.getElementsByClassName('mm-icon')).toHaveLength(1);
  });

  it('should render fallback image with custom fallbackIconProps if no ImageSource is provided', () => {
    const container = (
      <AvatarIcon
        data-testid="avatar-icon"
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
