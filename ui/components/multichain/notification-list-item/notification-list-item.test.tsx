import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationListItemIconType } from '../notification-list-item-icon/notification-list-item-icon';
import { TextVariant } from '../../../helpers/constants/design-system';
import {
  NotificationListItem,
  NotificationListItemProps,
} from './notification-list-item';

describe('NotificationListItem', () => {
  const defaultProps: NotificationListItemProps = {
    id: '123',
    isRead: false,
    icon: {
      type: NotificationListItemIconType.Token,
      value:
        'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
    },
    title: {
      items: [{ text: 'Test title' }],
    },
    description: {
      items: [{ text: 'Test description' }],
      variant: TextVariant.bodySm,
    },
    createdAt: new Date(),
    amount: '1.23 ETH',
  };

  it('should render the correct title and description', () => {
    render(<NotificationListItem {...defaultProps} />);
    expect(screen.getByText('Test title')).toBeDefined();
    expect(screen.getByText('Test description')).toBeDefined();
  });

  it('should render the correct amount', () => {
    render(<NotificationListItem {...defaultProps} />);
    expect(screen.getByText('1.23 ETH')).toBeDefined();
  });

  it('should render the unread dot if isRead prop is false', () => {
    render(<NotificationListItem {...defaultProps} />);
    expect(screen.getByTestId('unread-dot')).toBeDefined();
  });

  it('should not render the unread dot if isRead prop is true', () => {
    const props = { ...defaultProps, isRead: true };
    render(<NotificationListItem {...props} />);
    expect(screen.queryByTestId('notunread-dot')).toBeNull();
  });
});
