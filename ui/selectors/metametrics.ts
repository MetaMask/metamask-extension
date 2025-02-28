import { createSelector } from 'reselect';
import { MetaMaskReduxState } from '../store/store';

export const selectFragments = (state: MetaMaskReduxState) =>
  state.metamask.fragments;

export const getDataCollectionForMarketing = (state: MetaMaskReduxState) =>
  state.metamask.dataCollectionForMarketing;

export const getParticipateInMetaMetrics = (state: MetaMaskReduxState) =>
  Boolean(state.metamask.participateInMetaMetrics);

export const getLatestMetricsEventTimestamp = (state: MetaMaskReduxState) =>
  state.metamask.latestNonAnonymousEventTimestamp;

export const selectFragmentBySuccessEvent = createSelector(
  selectFragments,
  (_, fragmentOptions) => fragmentOptions,
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
