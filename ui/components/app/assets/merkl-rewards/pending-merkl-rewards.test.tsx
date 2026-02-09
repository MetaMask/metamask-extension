import React from 'react';
import { render } from '@testing-library/react';
import PendingMerklRewards from './pending-merkl-rewards';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, args?: string[]) => {
    const messages: Record<string, string> = {
      merklRewardsClaimableBonus: 'Claimable bonus',
      merklRewardsClaimableBonusTooltip: 'mUSD bonuses are claimed on Linea.',
      merklRewardsAnnualBonus: `${args?.[0]}% bonus`,
    };
    return messages[key] ?? key;
  },
}));

// Mock Tooltip to avoid complex portal rendering
jest.mock('../../../ui/tooltip', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

describe('PendingMerklRewards', () => {
  it('returns null when claimableReward is null', () => {
    const { container } = render(
      <PendingMerklRewards claimableReward={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders claimable bonus section when reward is present', () => {
    const { getByTestId, getByText } = render(
      <PendingMerklRewards claimableReward="10.50" />,
    );

    expect(getByTestId('pending-merkl-rewards')).toBeDefined();
    expect(getByText('Claimable bonus')).toBeDefined();
    expect(getByText('$10.50')).toBeDefined();
  });

  it('displays annual bonus APY', () => {
    const { getByText } = render(
      <PendingMerklRewards claimableReward="5.00" />,
    );

    expect(getByText('3% bonus')).toBeDefined();
  });

  it('displays the formatted dollar amount', () => {
    const { getByTestId } = render(
      <PendingMerklRewards claimableReward="0.50" />,
    );

    const amountElement = getByTestId('claimable-reward-amount');
    expect(amountElement.textContent).toBe('$0.50');
  });

  it('displays small amounts with "< 0.01" format', () => {
    const { getByTestId } = render(
      <PendingMerklRewards claimableReward="< 0.01" />,
    );

    const amountElement = getByTestId('claimable-reward-amount');
    expect(amountElement.textContent).toBe('$< 0.01');
  });

  it('renders info icon for tooltip', () => {
    const { getByTestId } = render(
      <PendingMerklRewards claimableReward="1.00" />,
    );

    expect(getByTestId('claimable-bonus-info-icon')).toBeDefined();
  });
});
