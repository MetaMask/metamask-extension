/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { AvatarNetwork } from '../avatar-network/avatar-network';
import { AvatarBadge } from './avatar-badge';

describe('AvatarBadge', () => {
  const args = {
    badgeProps: {
      tokenName: 'ast',
      tokenImageUrl: './AST.png',
      networkName: 'Arbitrum One',
      networkImageUrl: './images/arbitrum.svg',
    },
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  };

  it('should render correctly', () => {
    const { getByTestId } = render(
      <AvatarBadge
        data-testid="avatar-badge"
        BadgeVariant={AvatarNetwork}
        {...args}
      />,
    );
    expect(getByTestId('avatar-badge')).toBeDefined();
  });
});
