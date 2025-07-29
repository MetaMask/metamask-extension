import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
import { submitRequestToBackground } from '../background-connection';

export const enableGatorPermissions = async (): Promise<void> => {
  return await submitRequestToBackground('enableGatorPermissions', []);
};

export const disableGatorPermissions = async (): Promise<void> => {
  return await submitRequestToBackground('disableGatorPermissions', []);
};

export const fetchAndUpdateGatorPermissions =
  async (): Promise<GatorPermissionsMap> => {
    return await submitRequestToBackground(
      'fetchAndUpdateGatorPermissions',
      [],
    );
  };
