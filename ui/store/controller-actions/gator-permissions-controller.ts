import { submitRequestToBackground } from '../background-connection';
import { GatorPermissionsList } from '@metamask/gator-permissions-controller';

export const enableGatorPermissions = async (): Promise<void> => {
  return await submitRequestToBackground('enableGatorPermissions', []);
};

export const disableGatorPermissions = async (): Promise<void> => {
  return await submitRequestToBackground('disableGatorPermissions', []);
};

export const fetchAndUpdateGatorPermissions = async (): Promise<GatorPermissionsList> => {
  return await submitRequestToBackground('fetchAndUpdateGatorPermissions', []);
};
