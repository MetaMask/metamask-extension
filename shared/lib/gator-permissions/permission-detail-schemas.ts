import type { PermissionSchemaEntry } from '@metamask/7715-permission-types';
import { getPermissionSchemaEntry as getPermissionSchemaEntryFromPackage } from '@metamask/7715-permission-types';

import { captureMessage } from '../sentry';

export function getPermissionSchemaEntry(
  permissionType: string,
  throwIfUnknown: boolean = false,
): PermissionSchemaEntry {
  if (!throwIfUnknown) {
    captureUnknownPermissionType(permissionType);
  }
  return getPermissionSchemaEntryFromPackage(permissionType, throwIfUnknown);
}

const KNOWN_PERMISSION_TYPES = new Set([
  'native-token-periodic',
  'native-token-stream',
  'native-token-allowance',
  'erc20-token-periodic',
  'erc20-token-stream',
  'erc20-token-allowance',
  'token-approval-revocation',
]);

function captureUnknownPermissionType(permissionType: string): void {
  if (KNOWN_PERMISSION_TYPES.has(permissionType)) {
    return;
  }

  captureMessage('Unknown advanced permission type encountered', {
    extra: {
      permissionType,
    },
  });
}
