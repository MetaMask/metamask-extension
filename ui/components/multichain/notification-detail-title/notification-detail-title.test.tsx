import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationDetailTitle } from './notification-detail-title';

describe('NotificationDetailTitle', () => {
  it('renders the title and date', () => {
    render(<NotificationDetailTitle title="Test Title" date="2023-10-18" />);

    const titleElement = screen.getByText('Test Title');
    expect(titleElement).toBeInTheDocument();

    const dateElement = screen.getByText('2023-10-18');
    expect(dateElement).toBeInTheDocument();
  });
});
