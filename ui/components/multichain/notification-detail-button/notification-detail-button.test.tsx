import React from 'react';
import { render, screen } from '@testing-library/react';
import { ButtonVariant } from '../../component-library';
import { NotificationDetailButton } from './notification-detail-button';

describe('NotificationDetailButton', () => {
  const defaultProps = {
    variant: ButtonVariant.Primary,
    text: 'Click Me',
    href: 'http://example.com',
    id: 'test-button',
    isExternal: true,
  };

  it('renders without crashing', () => {
    render(<NotificationDetailButton {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: defaultProps.text });
    expect(button).toHaveAttribute('href', defaultProps.href);
  });
});
