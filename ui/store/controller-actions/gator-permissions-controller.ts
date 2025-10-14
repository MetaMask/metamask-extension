import {
  RevocationParams,
  GatorPermissionsMap,
} from '@metamask/gator-permissions-controller';
import { submitRequestToBackground } from '../background-connection';

export const fetchAndUpdateGatorPermissions =
  async (): Promise<GatorPermissionsMap> => {
    return await submitRequestToBackground(
      'fetchAndUpdateGatorPermissions',
      [],
    );
  };

export const submitRevocation = async (
  revocationParams: RevocationParams,
): Promise<void> => {
  return await submitRequestToBackground('submitRevocation', [
    revocationParams,
  ]);
};
