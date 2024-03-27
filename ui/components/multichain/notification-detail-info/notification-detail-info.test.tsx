import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { IconName } from '../../component-library';
import {
  NotificationDetailInfo,
  NotificationDetailInfoProps,
} from './notification-detail-info';

describe('NotificationDetailInfo', () => {
  const defaultProps: NotificationDetailInfoProps = {
    icon: {
      iconName: IconName.Arrow2Down,
      color: TextColor.primaryDefault,
      backgroundColor: BackgroundColor.successDefault,
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
