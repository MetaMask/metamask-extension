import { createSelector } from 'reselect';
import type { MetaMaskSliceState } from '../ducks/metamask/metamask';

export const selectFragments = (state: MetaMaskSliceState) =>
  state.metamask.fragments;

export const getDataCollectionForMarketing = (state: MetaMaskSliceState) =>
  state.metamask.dataCollectionForMarketing;

export const getParticipateInMetaMetrics = (state: MetaMaskSliceState) =>
  Boolean(state.metamask.participateInMetaMetrics);

export const getLatestMetricsEventTimestamp = (state: MetaMaskSliceState) =>
  state.metamask.latestNonAnonymousEventTimestamp;

export const selectFragmentBySuccessEvent = createSelector(
  selectFragments,
  (_, fragmentOptions) => fragmentOptions,
  (
    fragments: ReturnType<typeof selectFragments>,
    fragmentOptions: { persist: boolean; successEvent: string },
  ) => {
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
  (_, fragmentId) => fragmentId,
  (fragments, fragmentId) => {
    // A valid existing fragment must exist in state.
    // If these conditions are not meant we will create a new fragment.
    if (fragmentId && fragments?.[fragmentId]) {
      return fragments[fragmentId];
    }
    return undefined;
  },
);

export const selectMatchingFragment = createSelector(
  (state, params) =>
    selectFragmentBySuccessEvent(state, params.fragmentOptions),
  (state, params) => selectFragmentById(state, params.existingId),
  (matchedBySuccessEvent, matchedById) => matchedById ?? matchedBySuccessEvent,
);
