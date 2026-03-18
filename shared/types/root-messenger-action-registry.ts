// We're just using types from this file (although this should probably be in
// shared/).
// eslint-disable-next-line import/no-restricted-paths
import type { RootMessengerActions } from '../../app/scripts/lib/messenger';

export type RootMessengerActionRegistry = {
  [Action in RootMessengerActions as Action['type']]: Action['handler'];
};
