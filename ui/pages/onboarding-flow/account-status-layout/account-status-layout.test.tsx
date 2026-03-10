import React from 'react';
import { fireEvent, getByRole } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { AccountStatusLayout } from './account-status-layout';

const defaultProps = {
  dataTestId: 'account-status-layout',
  titleKey: 'accountAlreadyExistsTitle',
  descriptionKey: 'accountAlreadyExistsLoginDescription',
  descriptionInterpolation: ['user@example.com'],
  primaryButtonTextKey: 'accountAlreadyExistsLogin',
  onPrimaryButtonClick: jest.fn(),
  secondaryButtonTextKey: 'useDifferentLoginMethod',
  onSecondaryButtonClick: jest.fn(),
};

describe('AccountStatusLayout', () => {
  it('renders with title and description from i18n keys', () => {
    const { container } = renderWithProvider(
      <AccountStatusLayout {...defaultProps} />,
    );
    expect(container.querySelector('[data-testid="account-status-layout"]')).toBeInTheDocument();
    const heading = getByRole(container, 'heading', { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('calls onPrimaryButtonClick when primary button is clicked', () => {
    const onPrimary = jest.fn();
    const { getByTestId } = renderWithProvider(
      <AccountStatusLayout
        {...defaultProps}
        onPrimaryButtonClick={onPrimary}
      />,
    );
    fireEvent.click(getByTestId('onboarding-complete-done'));
    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('calls onSecondaryButtonClick when secondary button is clicked', () => {
    const onSecondary = jest.fn();
    const { getByTestId } = renderWithProvider(
      <AccountStatusLayout
        {...defaultProps}
        onSecondaryButtonClick={onSecondary}
      />,
    );
    fireEvent.click(getByTestId('account-exist-login-with-different-method'));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('applies rootClassName to the root element', () => {
    const { container } = renderWithProvider(
      <AccountStatusLayout
        {...defaultProps}
        rootClassName="custom-class h-full"
      />,
    );
    const root = container.querySelector('[data-testid="account-status-layout"]');
    expect(root).toHaveClass('custom-class');
    expect(root).toHaveClass('h-full');
  });
});
