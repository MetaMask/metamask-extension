import { createSelector } from 'reselect';
import {
  ThrottledOrigins,
  ThrottledOriginsState,
} from '../../shared/types/origin-throttling';

export type OriginThrottlingState = {
  metamask: ThrottledOriginsState;
};

const getThrottledOrigins = (state: OriginThrottlingState): ThrottledOrigins =>
  state.metamask.throttledOrigins;

export const throttledOriginsSelector = createSelector(
  getThrottledOrigins,
  (throttledOrigins) => throttledOrigins,
);
