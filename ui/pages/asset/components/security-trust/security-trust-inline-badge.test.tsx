import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { getResultTypeConfig } from '../../utils/security-utils';
import {
  SecurityTrustInlineBadge,
  SecurityTrustVerifiedBadge,
} from './security-trust-inline-badge';

const t = (key: string) => key;

describe('SecurityTrustInlineBadge', () => {
  it('renders verified icon without onClick', () => {
    const badge = getResultTypeConfig('Verified', t).badge;
    const { getByTestId } = render(
      <SecurityTrustInlineBadge
        badge={badge!}
        testId="security-badge-verified"
      />,
    );

    expect(getByTestId('security-badge-verified')).toBeInTheDocument();
  });

  it('wraps verified icon in a button when onClick is provided', () => {
    const badge = getResultTypeConfig('Verified', t).badge;
    const onClick = jest.fn();
    const { getByTestId } = render(
      <SecurityTrustInlineBadge
        badge={badge!}
        testId="security-badge-verified"
        onClick={onClick}
      />,
    );

    fireEvent.click(getByTestId('security-badge-verified'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders labeled warning badge with warning background', () => {
    const badge = getResultTypeConfig('Warning', t).badge;
    const { getByTestId, getByText } = render(
      <SecurityTrustInlineBadge
        badge={badge!}
        testId="security-badge-warning"
      />,
    );

    expect(getByTestId('security-badge-warning')).toHaveClass(
      'bg-warning-muted',
    );
    expect(getByText('securityTrustRisky')).toBeInTheDocument();
  });

  it('renders labeled malicious badge with error background', () => {
    const badge = getResultTypeConfig('Malicious', t).badge;
    const { getByTestId, getByText } = render(
      <SecurityTrustInlineBadge
        badge={badge!}
        testId="security-badge-malicious"
      />,
    );

    expect(getByTestId('security-badge-malicious')).toHaveClass(
      'bg-error-muted',
    );
    expect(getByText('securityTrustMalicious')).toBeInTheDocument();
  });

  it('wraps labeled badge in a button when onClick is provided', () => {
    const badge = getResultTypeConfig('Warning', t).badge;
    const onClick = jest.fn();
    const { getByTestId } = render(
      <SecurityTrustInlineBadge
        badge={badge!}
        testId="security-badge-warning"
        onClick={onClick}
      />,
    );

    fireEvent.click(getByTestId('security-badge-warning'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('SecurityTrustVerifiedBadge', () => {
  it('renders verified badge wrapper without onClick', () => {
    const badge = getResultTypeConfig('Verified', t).badge;
    const { getAllByTestId } = render(
      <SecurityTrustVerifiedBadge badge={badge!} />,
    );

    expect(getAllByTestId('security-badge-verified').length).toBeGreaterThan(0);
  });

  it('delegates onClick to inline badge', () => {
    const badge = getResultTypeConfig('Verified', t).badge;
    const onClick = jest.fn();
    const { getByTestId } = render(
      <SecurityTrustVerifiedBadge badge={badge!} onClick={onClick} />,
    );

    fireEvent.click(getByTestId('security-badge-verified'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
