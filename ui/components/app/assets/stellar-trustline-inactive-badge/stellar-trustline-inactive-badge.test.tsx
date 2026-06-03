import React from 'react';
import { render } from '@testing-library/react';
import { StellarTrustlineInactiveBadge } from './stellar-trustline-inactive-badge';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../component-library', () => ({
  Tag: ({
    label,
    backgroundColor,
    borderRadius,
    iconName,
    'data-testid': dataTestId,
  }: {
    label: string;
    backgroundColor?: string;
    borderRadius?: string;
    iconName?: string;
    'data-testid'?: string;
  }) => (
    <span
      data-testid={dataTestId}
      data-label={label}
      data-background-color={backgroundColor}
      data-border-radius={borderRadius}
      data-icon-name={iconName}
    >
      {label}
    </span>
  ),
}));

describe('StellarTrustlineInactiveBadge', () => {
  it('renders inactive label with warning styling', () => {
    const { getByTestId } = render(<StellarTrustlineInactiveBadge />);
    const badge = getByTestId('stellar-trustline-inactive-badge');

    expect(badge).toHaveAttribute('data-label', 'stellarTrustlineInactive');
    expect(badge).toHaveAttribute('data-background-color', 'warning-muted');
    expect(badge).toHaveAttribute('data-border-radius', 'pill');
    expect(badge).not.toHaveAttribute('data-icon-name');
  });
});
