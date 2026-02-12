import {
  CaveatConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import { Driver } from '../../webdriver/driver';
import { PermissionNames } from '../../../../app/scripts/controllers/permissions';
import { CaveatTypes } from '../../../../shared/constants/permissions';

export const getPermittedChains = async (driver: Driver) => {
  const getPermissionsRequest = JSON.stringify({
    method: 'wallet_getPermissions',
  });
  const getPermissionsResult = await driver.executeScript(
    `return window.ethereum.request(${getPermissionsRequest})`,
  );

  const permittedChains =
    getPermissionsResult
      ?.find(
        (permission: PermissionConstraint) =>
          permission.parentCapability === PermissionNames.permittedChains,
      )
      ?.caveats.find(
        (caveat: CaveatConstraint) =>
          caveat.type === CaveatTypes.restrictNetworkSwitching,
      )?.value || [];

  return permittedChains;
};
