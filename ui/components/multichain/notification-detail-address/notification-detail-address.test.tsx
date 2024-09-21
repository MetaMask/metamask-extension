import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationDetailAddress } from './notification-detail-address';

describe('NotificationDetailAddress', () => {
  it('renders without crashing', () => {
    render(
      <NotificationDetailAddress
        side="From"
        address="0x7830c87C02e56AFf27FA8Ab1241711331FA86F43"
      />,
    );
    expect(screen.getByText('From')).toBeInTheDocument();
  });
});
