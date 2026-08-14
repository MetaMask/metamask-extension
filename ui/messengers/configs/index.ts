import type {
  RootMessengerActions,
  RootMessengerEvents,
  // We are only using the type here (though this should probably be in
  // `shared/`).
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../../app/scripts/lib/messenger';
import * as keyringController from './keyring-controller';

type MessengerExclusions = {
  // This is named like this since it's intended to be defined as a top-level
  // property of a messenger configuration.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  EXCLUDED_CAPABILITIES: {
    actions: readonly RootMessengerActions['type'][];
    events: readonly RootMessengerEvents['type'][];
  };
};

// If you need to exclude an action or event from being accessible in the UI,
// add a file to this directory and then add the module to this list.
// Note: A file does not need to exist for every controller or service, just
// those that need to exclude certain actions and/or events.
export const MESSENGERS_WITH_EXCLUSIONS = [
  keyringController,
] satisfies MessengerExclusions[];
