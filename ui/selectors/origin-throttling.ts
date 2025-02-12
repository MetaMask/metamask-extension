import { createSelector } from 'reselect';
import {
  ThrottledOrigins,
  ThrottledOriginsState,
} from '../../shared/types/origin-throttling';

export type OriginThrottlingState = {
  metamask: ThrottledOriginsState;
};

export const selectThrottledOrigins = (state: OriginThrottlingState) =>
  state.metamask.throttledOrigins;
