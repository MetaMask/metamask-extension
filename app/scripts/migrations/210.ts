import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 210;

type DelegationControllerState = {
  // `delegations` is removed in @metamask/delegation-controller v3.0.0
  delegations?: unknown;
};

/**
 * This migration removes the legacy persisted `delegations` state from the
 * DelegationController. As of `@metamask/delegation-controller` v3.0.0, the
 * controller no longer persists delegation entries (the `store`, `list`,
 * `retrieve`, `chain`, and `delete` methods were removed), so any previously
 * persisted entries should be cleared from disk.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'DelegationController') ||
    !isObject(versionedData.data.DelegationController)
  ) {
    return;
  }

  const { DelegationController } = versionedData.data;
  const delegationController =
    DelegationController as DelegationControllerState;

  if (!hasProperty(delegationController, 'delegations')) {
    return;
  }

  delete delegationController.delegations;

  changedControllers.add('DelegationController');
}) satisfies Migrate;
