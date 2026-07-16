import { createSelector } from 'reselect';
import type { MetaMetricsEventFragment } from '../../shared/constants/metametrics';

export type MetaMetricsState = {
  metamask: {
    fragments: Record<string, MetaMetricsEventFragment>;
    dataCollectionForMarketing: boolean | null;
    optedIn?: boolean;
    completedMetaMetricsOnboarding?: boolean;
    pna25Acknowledged?: boolean;
  };
};

type FragmentOptions = Partial<MetaMetricsEventFragment>;

type MatchingFragmentParams = {
  fragmentOptions: FragmentOptions;
  existingId: string;
};

const selectFragments = (state: MetaMetricsState) => state.metamask.fragments;

// return true if user has set their marketing consent preference or if they are a social login user
export const getDataCollectionForMarketing = (state: MetaMetricsState) =>
  state.metamask.dataCollectionForMarketing;

// return whether the user has opted in to analytics (AnalyticsController.optedIn)
export const getOptedIn = (state: MetaMetricsState) =>
  state.metamask.optedIn === true;

// return true once the user has completed the metrics participation prompt (yes or no)
export const getCompletedMetaMetricsOnboarding = (state: MetaMetricsState) =>
  state.metamask.completedMetaMetricsOnboarding === true;

export const getPna25Acknowledged = (state: MetaMetricsState) =>
  state.metamask.pna25Acknowledged;

export const selectFragmentBySuccessEvent = createSelector(
  selectFragments,
  (_state: MetaMetricsState, fragmentOptions: FragmentOptions) =>
    fragmentOptions,
  (fragments, fragmentOptions) => {
    if (fragmentOptions.persist) {
      return Object.values(fragments).find(
        (fragment) => fragment.successEvent === fragmentOptions.successEvent,
      );
    }
    return undefined;
  },
);

export const selectFragmentById = createSelector(
  selectFragments,
  (_state: MetaMetricsState, fragmentId: string) => fragmentId,
  (fragments, fragmentId) => {
    // A valid existing fragment must exist in state.
    // If these conditions are not meant we will create a new fragment.
    if (fragmentId && fragments[fragmentId]) {
      return fragments[fragmentId];
    }
    return undefined;
  },
);

export const selectMatchingFragment = createSelector(
  (state: MetaMetricsState, params: MatchingFragmentParams) =>
    selectFragmentBySuccessEvent(state, params.fragmentOptions),
  (state: MetaMetricsState, params: MatchingFragmentParams) =>
    selectFragmentById(state, params.existingId),
  (matchedBySuccessEvent, matchedById) => matchedById ?? matchedBySuccessEvent,
);
