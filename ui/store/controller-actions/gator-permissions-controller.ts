import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
import { submitRequestToBackground } from '../background-connection';

export const fetchAndUpdateGatorPermissions =
  async (): Promise<GatorPermissionsMap> => {
    return await submitRequestToBackground(
      'fetchAndUpdateGatorPermissions',
      [],
    );
  };
