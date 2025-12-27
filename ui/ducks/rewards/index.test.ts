import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { OnboardingStep } from './types';
import rewardsReducer, {
  initialState,
  resetRewardsState,
  setOnboardingModalOpen,
  setOnboardingActiveStep,
  setOnboardingReferralCode,
  setRewardsGeoMetadata,
  setRewardsGeoMetadataLoading,
  setRewardsGeoMetadataError,
  setCandidateSubscriptionId,
  setSeasonStatus,
  setSeasonStatusLoading,
  setSeasonStatusError,
  setErrorToast,
  setRewardsBadgeHidden,
} from '.';

describe('Ducks - Rewards', () => {
  const middleware = [thunk];
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = configureMockStore<any>(middleware)({ rewards: initialState });

  beforeEach(() => {
    store.clearActions();
  });

  describe('reducer', () => {
    it('initializes state', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(rewardsReducer(undefined as any, {} as any)).toStrictEqual(
        initialState,
      );
    });

    it('returns state unchanged for unknown action type', () => {
      const mockState = {
        ...initialState,
        onboardingModalOpen: true,
      };
      expect(
        rewardsReducer(mockState, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'unknown' as any,
        }),
      ).toStrictEqual(mockState);
    });
  });

  describe('actions + reducer', () => {
    it('resetRewardsState resets to initialState', () => {
      const mutated = {
        ...initialState,
        onboardingModalOpen: true,
        geoLocation: 'US',
        optinAllowedForGeo: true,
      };
      const action = resetRewardsState();
      expect(action.type).toBe('rewards/resetRewardsState');
      const newState = rewardsReducer(mutated, action);
      expect(newState).toStrictEqual(initialState);
    });

    it('setOnboardingModalOpen updates onboardingModalOpen', () => {
      store.dispatch(setOnboardingModalOpen(true));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setOnboardingModalOpen');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.onboardingModalOpen).toBe(true);
    });

    it('setOnboardingActiveStep updates onboardingActiveStep', () => {
      store.dispatch(setOnboardingActiveStep(OnboardingStep.STEP1));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setOnboardingActiveStep');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.onboardingActiveStep).toBe(OnboardingStep.STEP1);
    });

    it('setOnboardingReferralCode updates onboardingReferralCode', () => {
      store.dispatch(setOnboardingReferralCode('ABC123'));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setOnboardingReferralCode');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.onboardingReferralCode).toBe('ABC123');
    });

    it('setOnboardingReferralCode clears onboardingReferralCode when payload is null', () => {
      const existing = { ...initialState, onboardingReferralCode: 'ABC123' };
      store.dispatch(setOnboardingReferralCode(null));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setOnboardingReferralCode');
      const newState = rewardsReducer(existing, actions[0]);
      expect(newState.onboardingReferralCode).toBeNull();
    });

    it('setRewardsGeoMetadata sets location and opt-in flags when payload provided', () => {
      const payload = { geoLocation: 'US', optinAllowedForGeo: true };
      store.dispatch(setRewardsGeoMetadata(payload));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setRewardsGeoMetadata');
      const newState = rewardsReducer(
        { ...initialState, optinAllowedForGeoLoading: true },
        actions[0],
      );
      expect(newState.geoLocation).toBe('US');
      expect(newState.optinAllowedForGeo).toBe(true);
      expect(newState.optinAllowedForGeoLoading).toBe(false);
    });

    it('setRewardsGeoMetadata clears fields when payload is null', () => {
      store.dispatch(setRewardsGeoMetadata(null));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setRewardsGeoMetadata');
      const existing = {
        ...initialState,
        geoLocation: 'CA-ON',
        optinAllowedForGeo: false,
        optinAllowedForGeoLoading: true,
      };
      const newState = rewardsReducer(existing, actions[0]);
      expect(newState.geoLocation).toBeNull();
      expect(newState.optinAllowedForGeo).toBeNull();
      expect(newState.optinAllowedForGeoLoading).toBe(false);
    });

    it('setRewardsGeoMetadataLoading updates loading flag', () => {
      store.dispatch(setRewardsGeoMetadataLoading(true));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setRewardsGeoMetadataLoading');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.optinAllowedForGeoLoading).toBe(true);
    });

    it('setRewardsGeoMetadataError updates error flag', () => {
      store.dispatch(setRewardsGeoMetadataError(true));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setRewardsGeoMetadataError');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.optinAllowedForGeoError).toBe(true);
    });

    it('setCandidateSubscriptionId sets id', () => {
      store.dispatch(setCandidateSubscriptionId('sub_123'));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setCandidateSubscriptionId');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.candidateSubscriptionId).toBe('sub_123');
    });

    it('setSeasonStatusLoading updates loading flag', () => {
      store.dispatch(setSeasonStatusLoading(true));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setSeasonStatusLoading');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.seasonStatusLoading).toBe(true);
    });

    it('setSeasonStatus sets season status', () => {
      const payload = {
        season: {
          id: 's1',
          name: 'Season 1',
          startDate: 0,
          endDate: 1,
          tiers: [],
        },
        balance: { total: 100 },
        tier: {
          currentTier: {
            id: 't1',
            name: 'Tier 1',
            pointsNeeded: 0,
            image: { lightModeUrl: '', darkModeUrl: '' },
            levelNumber: '1',
            rewards: [],
          },
          nextTier: null,
          nextTierPointsNeeded: null,
        },
      };
      store.dispatch(setSeasonStatus(payload));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setSeasonStatus');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.seasonStatus).toStrictEqual(payload);
    });

    it('setSeasonStatusError sets error string', () => {
      store.dispatch(setSeasonStatusError('oops'));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setSeasonStatusError');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.seasonStatusError).toBe('oops');
    });

    it('setErrorToast updates toast properties', () => {
      const toast = {
        isOpen: true,
        title: 'Error',
        description: 'Something went wrong',
        actionText: 'Retry',
        onActionClick: jest.fn(),
      };
      store.dispatch(setErrorToast(toast));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setErrorToast');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.errorToast).toStrictEqual(toast);
    });

    it('setRewardsBadgeHidden updates rewardsBadgeHidden to true', () => {
      store.dispatch(setRewardsBadgeHidden(true));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setRewardsBadgeHidden');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.rewardsBadgeHidden).toBe(true);
    });

    it('setRewardsBadgeHidden updates rewardsBadgeHidden to false', () => {
      store.dispatch(setRewardsBadgeHidden(false));
      const actions = store.getActions();
      expect(actions[0].type).toBe('rewards/setRewardsBadgeHidden');
      const newState = rewardsReducer(initialState, actions[0]);
      expect(newState.rewardsBadgeHidden).toBe(false);
    });
  });
});
