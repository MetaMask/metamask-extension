import { ThrottledOriginsState } from '../../shared/types/origin-throttling';

type OriginThrottlingState = {
  metamask: ThrottledOriginsState;
};

export const selectThrottledOrigins = (state: OriginThrottlingState) =>
  state.metamask.throttledOrigins;
