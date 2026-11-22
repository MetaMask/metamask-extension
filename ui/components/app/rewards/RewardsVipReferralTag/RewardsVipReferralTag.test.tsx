import * as React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { RewardsVipReferralTag } from './RewardsVipReferralTag';

describe('RewardsVipReferralTag', () => {
  const store = configureStore(mockState);

  it('renders the tag container', () => {
    renderWithProvider(<RewardsVipReferralTag />, store);

    expect(screen.getByTestId('rewards-vip-referral-tag')).toBeInTheDocument();
  });

  it('renders the gold VIP icon', () => {
    renderWithProvider(<RewardsVipReferralTag />, store);

    const tag = screen.getByTestId('rewards-vip-referral-tag');
    expect(within(tag).getByRole('img')).toBeInTheDocument();
  });
});
