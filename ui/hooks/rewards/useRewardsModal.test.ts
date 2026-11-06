import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useRewardsModal } from './useRewardsModal';

jest.mock('./useCandidateSubscriptionId', () => ({
  useCandidateSubscriptionId: jest.fn(),
}));

type StateOverrides = {
  rewardsEnabled?: boolean;
  deepLinkUrl?: string | null;
};

const buildState = ({
  rewardsEnabled = true,
  deepLinkUrl = null,
}: StateOverrides = {}) => ({
  metamask: {
    useExternalServices: rewardsEnabled,
    remoteFeatureFlags: { rewardsEnabled },
  },
  rewards: {
    rewardsDeepLinkUrl: deepLinkUrl,
    rewardsModalOpen: false,
  },
});

const getRewardsModalOpen = (store: unknown): boolean => {
  const typed = store as {
    getState: () => { rewards: { rewardsModalOpen: boolean } };
  };
  return typed.getState().rewards.rewardsModalOpen;
};

describe('useRewardsModal', () => {
  it('opens the rewards modal when rewards are enabled and a deep link is present', async () => {
    const { store } = renderHookWithProvider(
      () => useRewardsModal(),
      buildState({
        rewardsEnabled: true,
        deepLinkUrl: 'https://link.metamask.io/rewards',
      }),
    );

    await waitFor(() => {
      expect(getRewardsModalOpen(store)).toBe(true);
    });
  });

  it('does not open the modal when rewards are disabled', () => {
    const { store } = renderHookWithProvider(
      () => useRewardsModal(),
      buildState({
        rewardsEnabled: false,
        deepLinkUrl: 'https://link.metamask.io/rewards',
      }),
    );

    expect(getRewardsModalOpen(store)).toBe(false);
  });

  it('does not open the modal when no deep link URL is present', () => {
    const { store } = renderHookWithProvider(
      () => useRewardsModal(),
      buildState({ rewardsEnabled: true, deepLinkUrl: null }),
    );

    expect(getRewardsModalOpen(store)).toBe(false);
  });
});
