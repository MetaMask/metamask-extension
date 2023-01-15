/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { AvatarFavicon, AVATAR_FAVICON_SIZES } from '.';

describe('AvatarFavicon', () => {
  const args = {
    src: './images/eth_logo.svg',
  };

  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarFavicon data-testid="avatar-favicon" />,
    );
    expect(getByTestId('avatar-favicon')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render image of Avatar Favicon', () => {
    render(<AvatarFavicon data-testid="avatar-favicon" {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.src);
  });

  it('should render fallback image if no ImageSource is provided', () => {
    const { container } = render(
      <AvatarFavicon data-testid="avatar-favicon" />,
    );
    expect(container.getElementsByClassName('mm-icon')).toHaveLength(1);
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

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <AvatarFavicon
          size={AVATAR_FAVICON_SIZES.XS}
          data-testid={AVATAR_FAVICON_SIZES.XS}
          {...args}
        />
        <AvatarFavicon
          size={AVATAR_FAVICON_SIZES.SM}
          data-testid={AVATAR_FAVICON_SIZES.SM}
          {...args}
        />
        <AvatarFavicon
          size={AVATAR_FAVICON_SIZES.MD}
          data-testid={AVATAR_FAVICON_SIZES.MD}
          {...args}
        />
        <AvatarFavicon
          size={AVATAR_FAVICON_SIZES.LG}
          data-testid={AVATAR_FAVICON_SIZES.LG}
          {...args}
        />
        <AvatarFavicon
          size={AVATAR_FAVICON_SIZES.XL}
          data-testid={AVATAR_FAVICON_SIZES.XL}
          {...args}
        />
      </>,
    );
    expect(getByTestId(AVATAR_FAVICON_SIZES.XS)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_FAVICON_SIZES.XS}`,
    );
    expect(getByTestId(AVATAR_FAVICON_SIZES.SM)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_FAVICON_SIZES.SM}`,
    );
    expect(getByTestId(AVATAR_FAVICON_SIZES.MD)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_FAVICON_SIZES.MD}`,
    );
    expect(getByTestId(AVATAR_FAVICON_SIZES.LG)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_FAVICON_SIZES.LG}`,
    );
    expect(getByTestId(AVATAR_FAVICON_SIZES.XL)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_FAVICON_SIZES.XL}`,
    );
  });

  it('should render with custom classname', () => {
    const { getByTestId } = render(
      <AvatarFavicon
        className="mm-avatar-favicon--test"
        data-testid="classname"
        {...args}
      />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-avatar-favicon--test');
  });
});
