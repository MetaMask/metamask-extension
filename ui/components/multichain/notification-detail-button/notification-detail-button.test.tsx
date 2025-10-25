import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { ButtonVariant } from '../../component-library';
import {
  NotificationDetailButton,
  NotificationDetailButtonProps,
} from './notification-detail-button';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
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
    renderWithProvider(<NotificationDetailButton {...defaultProps} />);
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
    const button = screen.getByRole('link', { name: defaultProps.text });
    expect(button).toHaveAttribute('href', defaultProps.href);
  });
});
