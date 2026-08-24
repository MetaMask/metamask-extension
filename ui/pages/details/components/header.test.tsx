import React from 'react';
import { render } from '@testing-library/react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { Header } from './header';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) =>
    substitutions ? `${key}|${substitutions.join(',')}` : key,
}));

const buildApproval = (status: 'pending' | 'success', symbol = 'USDC') =>
  ({
    type: 'approveSpendingCap',
    chainId: 'eip155:1',
    status,
    timestamp: 1,
    hash: '0xabc',
    data: {
      token: {
        direction: 'out',
        symbol,
      },
    },
  }) as ActivityListItem;

const approveTitleCases = [
  ['pending', 'activity_approveSpendingCap_pending_title|USDC'],
  ['success', 'activity_approveSpendingCap_success_title|USDC'],
] as const;

describe('Header', () => {
  for (const [status, expectedTitle] of approveTitleCases) {
    it(`includes the token symbol in the ${status} approve title`, () => {
      const { getByText } = render(
        <Header item={buildApproval(status)} onBack={jest.fn()} />,
      );

      expect(getByText(expectedTitle)).toBeInTheDocument();
    });
  }

  it('uses a title without a symbol when the approval has no token symbol', () => {
    const { getByText } = render(
      <Header item={buildApproval('success', '')} onBack={jest.fn()} />,
    );

    expect(
      getByText('activity_approveSpendingCapUnknownToken_success_title'),
    ).toBeInTheDocument();
  });
});
