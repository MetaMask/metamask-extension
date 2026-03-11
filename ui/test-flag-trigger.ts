import { getRemoteFeatureFlags } from './selectors/remote-feature-flags';

type State = Parameters<typeof getRemoteFeatureFlags>[0];

export function getTestFlag(state: State) {
  return getRemoteFeatureFlags(state)?.thisIsAFakeTestFlag;
}
