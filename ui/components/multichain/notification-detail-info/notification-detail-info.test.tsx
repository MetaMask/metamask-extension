import React from 'react';
import { render, screen } from '@testing-library/react';
import { AvatarIconSeverity, IconName } from '@metamask/design-system-react';
import {
  NotificationDetailInfo,
  NotificationDetailInfoProps,
} from './notification-detail-info';

describe('NotificationDetailInfo', () => {
  const defaultProps: NotificationDetailInfoProps = {
    icon: {
      iconName: IconName.Arrow2Down,
      severity: AvatarIconSeverity.Success,
    },
    label: 'Test Label',
    detail: 'Test Detail',
    action: <button>Test Action</button>,
  };

  it('renders without crashing', () => {
    render(<NotificationDetailInfo {...defaultProps} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Detail')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Test Action' }),
    ).toBeInTheDocument();
  });
});
