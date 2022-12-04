/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { ICON_NAMES } from '..';
import { AvatarIcon, AVATAR_ICON_SIZES } from '.';

describe('AvatarIcon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarIcon
        iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
        data-testid="avatar-icon"
        ariaLabel="swap"
      />,
    );
    expect(getByTestId('avatar-icon')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <AvatarIcon
          iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
          ariaLabel={`${AVATAR_ICON_SIZES.XS} icon`}
          size={AVATAR_ICON_SIZES.XS}
          data-testid={AVATAR_ICON_SIZES.XS}
        />
        <AvatarIcon
          iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
          ariaLabel={`${AVATAR_ICON_SIZES.SM} icon`}
          size={AVATAR_ICON_SIZES.SM}
          data-testid={AVATAR_ICON_SIZES.SM}
        />
        <AvatarIcon
          iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
          ariaLabel={`${AVATAR_ICON_SIZES.MD} icon`}
          size={AVATAR_ICON_SIZES.MD}
          data-testid={AVATAR_ICON_SIZES.MD}
        />
        <AvatarIcon
          iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
          ariaLabel={`${AVATAR_ICON_SIZES.LG} icon`}
          size={AVATAR_ICON_SIZES.LG}
          data-testid={AVATAR_ICON_SIZES.LG}
        />
        <AvatarIcon
          iconName={ICON_NAMES.SWAP_HORIZONTAL_OUTLINE}
          ariaLabel={`${AVATAR_ICON_SIZES.XL} icon`}
          size={AVATAR_ICON_SIZES.XL}
          data-testid={AVATAR_ICON_SIZES.XL}
        />
      </>,
    );
    expect(getByTestId(AVATAR_ICON_SIZES.XS)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ICON_SIZES.XS}`,
    );
    expect(getByTestId(AVATAR_ICON_SIZES.SM)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ICON_SIZES.SM}`,
    );
    expect(getByTestId(AVATAR_ICON_SIZES.MD)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ICON_SIZES.MD}`,
    );
    expect(getByTestId(AVATAR_ICON_SIZES.LG)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ICON_SIZES.LG}`,
    );
    expect(getByTestId(AVATAR_ICON_SIZES.XL)).toHaveClass(
      `mm-avatar-base--size-${AVATAR_ICON_SIZES.XL}`,
    );
  });
});
