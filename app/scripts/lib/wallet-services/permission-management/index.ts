/**
 * permission-management
 *
 * Approval resolution, permission revocation, and caveat updates.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: acceptPendingApproval and rejectPendingApproval are
 * duplicated verbatim in mobile Engine.ts (L1206, L1181) with the same
 * ApprovalController call pattern.
 *
 * Remaining methods not yet extracted (6 of 9):
 *   requestAccountsPermission, updateCaveat, grantPermissions,
 *   requestPermissionsForOrigin, updateNetworksList, setEnabledNetworks
 */

import type { RootMessenger } from '../../messenger';

export type PermissionManagementDependencies = {
  messenger: RootMessenger;
};

/**
 * Revokes all permissions for the given subjects.
 * Silently ignores missing permissions (PermissionsRequestNotFoundError).
 *
 * Extracted from MetamaskController.removePermissionsFor (line 8582).
 *
 * TODO: Requires messenger action: PermissionController:revokePermissions
 */
export function removePermissionsFor(
  deps: PermissionManagementDependencies,
  subjects: Record<string, string[]>,
): void {
  deps.messenger.call('PermissionController:revokePermissions', subjects);
}

/**
 * Accepts (resolves) a pending approval request.
 *
 * Extracted from MetamaskController.resolvePendingApproval (line 8701).
 * Same pattern as mobile Engine.ts L1206.
 *
 * TODO: Requires messenger action: ApprovalController:accept
 */
export async function resolvePendingApproval(
  deps: PermissionManagementDependencies,
  id: string,
  value: unknown,
  options?: { waitForResult?: boolean },
): Promise<void> {
  const approvalOptions =
    typeof options?.waitForResult === 'boolean'
      ? { waitForResult: options.waitForResult }
      : undefined;

  await deps.messenger.call(
    'ApprovalController:accept',
    id,
    value,
    approvalOptions,
  );
}

/**
 * Rejects a pending approval request with a JSON-RPC error.
 * Silently ignores if the approval was already handled.
 *
 * Extracted from MetamaskController.rejectPendingApproval (line 8726).
 * Same pattern as mobile Engine.ts L1181.
 *
 * TODO: Requires messenger action: ApprovalController:reject
 */
export function rejectPendingApproval(
  deps: PermissionManagementDependencies,
  id: string,
  error: { code: number; message: string; data?: unknown },
): void {
  deps.messenger.call('ApprovalController:reject', id, error);
}
