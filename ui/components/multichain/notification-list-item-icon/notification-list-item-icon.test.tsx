import { render, screen } from '@testing-library/react';
import React from 'react';

import { IconName, BadgeWrapperPosition } from '../../component-library';
import type {
  BadgeProps} from './notification-list-item-icon';
import {
  NotificationListItemIcon,
  NotificationListItemIconType
} from './notification-list-item-icon';

describe('NotificationListItemIcon', () => {
  const defaultProps = {
    type: NotificationListItemIconType.Token,
    value:
      'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
    badge: {
      icon: IconName.Ethereum,
      position: BadgeWrapperPosition.bottomRight,
    } as BadgeProps,
  };

  it('should render the correct token icon based on type', () => {
    render(<NotificationListItemIcon {...defaultProps} />);
    expect(screen.getByTestId('avatar-token')).toBeDefined();
  });

  it('should render a badge if provided', () => {
    render(<NotificationListItemIcon {...defaultProps} />);
    expect(screen.getByTestId('badge-wrapper')).toBeDefined();
  });

  it('should not render a badge if not provided', () => {
    render(
      <NotificationListItemIcon
        type={NotificationListItemIconType.Token}
        value="https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg"
      />,
    );
    expect(screen.queryByTestId('badge-wrapper')).toBeNull();
  });
});
