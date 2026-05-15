import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useRewardsModal } from './useRewardsModal';

jest.mock('./useCandidateSubscriptionId', () => ({
  useCandidateSubscriptionId: jest.fn(),
}));

type StateOverrides = {
  rewardsEnabled?: boolean;
  deeplinkUrl?: string | null;
};

const buildState = ({
  rewardsEnabled = true,
  deeplinkUrl = null,
}: StateOverrides = {}) => ({
  metamask: {
    useExternalServices: rewardsEnabled,
    remoteFeatureFlags: { rewardsEnabled },
  },
  rewards: {
    rewardsDeeplinkUrl: deeplinkUrl,
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
  it('opens the rewards modal when rewards are enabled and a deeplink is present', async () => {
    const { store } = renderHookWithProvider(
      () => useRewardsModal(),
      buildState({
        rewardsEnabled: true,
        deeplinkUrl: 'https://link.metamask.io/rewards',
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
        deeplinkUrl: 'https://link.metamask.io/rewards',
      }),
    );

    expect(getRewardsModalOpen(store)).toBe(false);
  });

  it('does not open the modal when no deeplink URL is present', () => {
    const { store } = renderHookWithProvider(
      () => useRewardsModal(),
      buildState({ rewardsEnabled: true, deeplinkUrl: null }),
    );

    expect(getRewardsModalOpen(store)).toBe(false);
  });
});
