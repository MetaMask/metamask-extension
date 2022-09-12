/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { AvatarNetwork } from '../avatar-network/avatar-network';
import { AvatarWithBadge, badgePositions } from './avatar-badge';

describe('AvatarWithBadge', () => {
  const args = {
    badgeProps: {
      tokenName: 'ast',
      tokenImageUrl: './AST.png',
      networkName: 'Arbitrum One',
      networkImageUrl: './images/arbitrum.svg',
    },
    badgePosition: badgePositions.top,
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  };

  it('should render correctly', () => {
    const { getByTestId } = render(
      <AvatarWithBadge
        data-testid="avatar-badge"
        badge={<AvatarNetwork {...args.badgeProps} />}
        {...args}
      />,
    );
    expect(getByTestId('avatar-badge')).toBeDefined();
  });

  it('should render badge network with bottom right position correctly', () => {
    const { container } = render(
      <AvatarWithBadge
        data-testid="avatar-badge"
        badgePosition={badgePositions.bottom}
        badge={<AvatarNetwork {...args.badgeProps} />}
        {...args}
      />,
    );

    const badge = container.getElementsByClassName(
      'avatar-badge-token-position-bottom',
    );
    expect(badge).toBeDefined();
  });

  it('should render badge network with top right position correctly', () => {
    const { container } = render(
      <AvatarWithBadge
        data-testid="avatar-badge"
        badge={<AvatarNetwork {...args.badgeProps} />}
        {...args}
      />,
    );
    const badge = container.getElementsByClassName(
      'avatar-badge-token-position-top',
    );
    expect(badge).toBeDefined();
  });
});
