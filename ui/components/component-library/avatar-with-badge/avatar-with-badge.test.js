/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { AvatarNetwork } from '../avatar-network/avatar-network';
import { COLORS } from '../../../helpers/constants/design-system';
import { AvatarWithBadge } from './avatar-with-badge';
import { AVATAR_WITH_BADGE_POSTIONS } from './avatar-with-badge.constants';

describe('AvatarWithBadge', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarWithBadge
        badgePosition={AVATAR_WITH_BADGE_POSTIONS.BOTTOM}
        data-testid="avatar-with-badge"
        badge={
          <AvatarNetwork
            name="Arbitrum One"
            src="./images/arbitrum.svg"
            data-testid="badge"
          />
        }
      />,
    );
    expect(getByTestId('avatar-with-badge')).toBeDefined();
    expect(getByTestId('badge')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render badge network with bottom right position correctly', () => {
    const { container } = render(
      <AvatarWithBadge
        data-testid="avatar-with-badge"
        badgePosition={AVATAR_WITH_BADGE_POSTIONS.BOTTOM}
        badge={
          <AvatarNetwork
            name="Arbitrum One"
            src="./images/arbitrum.svg"
            data-testid="badge"
          />
        }
      />,
    );

    expect(
      container.getElementsByClassName(
        'mm-avatar-with-badge__badge-wrapper--position-bottom',
      ),
    ).toHaveLength(1);
  });

  it('should render badge network with top right position correctly', () => {
    const { container } = render(
      <AvatarWithBadge
        data-testid="avatar-with-badge"
        badgePosition={AVATAR_WITH_BADGE_POSTIONS.TOP}
        badge={
          <AvatarNetwork
            name="Arbitrum One"
            src="./images/arbitrum.svg"
            data-testid="badge"
          />
        }
      />,
    );

    expect(
      container.getElementsByClassName(
        'mm-avatar-with-badge__badge-wrapper--position-top',
      ),
    ).toHaveLength(1);
  });
  it('should render badge network with badgeWrapperProps', () => {
    const container = (
      <AvatarWithBadge
        data-testid="avatar-with-badge"
        badgePosition={AVATAR_WITH_BADGE_POSTIONS.TOP}
        badgeWrapperProps={{ borderColor: COLORS.ERROR_DEFAULT }}
        badge={
          <AvatarNetwork
            name="Arbitrum One"
            src="./images/arbitrum.svg"
            data-testid="badge"
          />
        }
      />
    );
    expect(container.props.badgeWrapperProps.borderColor).toStrictEqual(
      'error-default',
    );
  });

  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <AvatarWithBadge
        data-testid="avatar-with-badge"
        className="test-class"
      />,
    );
    expect(getByTestId('avatar-with-badge')).toHaveClass('test-class');
  });
});
