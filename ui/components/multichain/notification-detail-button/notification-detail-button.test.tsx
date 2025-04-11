import { render, screen } from '@testing-library/react';
import React from 'react';

import { ButtonVariant } from '../../component-library';
import type {
  NotificationDetailButtonProps} from './notification-detail-button';
import {
  NotificationDetailButton
} from './notification-detail-button';

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

describe('NotificationDetailButton', () => {
  const defaultProps: NotificationDetailButtonProps = {
    variant: ButtonVariant.Primary,
    text: 'Click Me',
    href: 'http://example.com',
    isExternal: true,
  };

  it('renders without crashing', () => {
    render(<NotificationDetailButton {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: defaultProps.text });
    expect(button).toHaveAttribute('href', defaultProps.href);
  });
});
