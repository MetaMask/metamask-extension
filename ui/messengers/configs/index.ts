//========
// Note: A file does not need to exist for every controller or service, just
// those that need to exclude certain actions and/or events.
//========
import * as accountTreeController from './account-tree-controller';
import * as keyringController from './keyring-controller';
import * as notificationServicesController from './notification-services-controller';

// If you need to exclude an action or event from being accessible in the UI,
// add a file to this directory and then add the module to this list.
export const MESSENGERS_WITH_EXCLUSIONS = [
  accountTreeController,
  keyringController,
  notificationServicesController,
] as const;
