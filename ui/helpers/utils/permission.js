import deepFreeze from 'deep-freeze-strict';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import React from 'react';
import { getRpcCaveatOrigins } from '@metamask/snaps-controllers/dist/snaps/endowments/rpc';
import { SnapCaveatType } from '@metamask/snaps-utils';
import { isNonEmptyArray } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IN
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  EndowmentPermissions,
  PermissionNamespaces,
  ///: END:ONLY_INCLUDE_IN
} from '../../../shared/constants/permissions';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { SNAPS_METADATA } from '../../../shared/constants/snaps';
import { coinTypeToProtocolName, getSnapDerivationPathName } from './util';
///: END:ONLY_INCLUDE_IN

const UNKNOWN_PERMISSION = Symbol('unknown');

const PERMISSION_DESCRIPTIONS = deepFreeze({
  [RestrictedMethods.eth_accounts]: (t) => ({
    label: t('permission_ethereumAccounts'),
    leftIcon: 'fas fa-eye',
    rightIcon: null,
    weight: 2,
  }),
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  [RestrictedMethods.snap_confirm]: (t) => ({
    label: t('permission_customConfirmation'),
    leftIcon: 'fas fa-user-check',
    rightIcon: null,
    weight: 3,
  }),
  [RestrictedMethods.snap_dialog]: (t) => ({
    label: t('permission_dialog'),
    leftIcon: 'fas fa-user-check',
    rightIcon: null,
    weight: 3,
  }),
  [RestrictedMethods.snap_notify]: (t) => ({
    leftIcon: 'fas fa-bell',
    label: t('permission_notifications'),
    rightIcon: null,
    weight: 3,
  }),
  [RestrictedMethods.snap_getBip32PublicKey]: (t, _, permissionValue) =>
    permissionValue.caveats[0].value.map(({ path, curve }) => {
      const baseDescription = {
        leftIcon: 'fas fa-eye',
        rightIcon: null,
        weight: 1,
      };

      const friendlyName = getSnapDerivationPathName(path, curve);
      if (friendlyName) {
        return {
          ...baseDescription,
          label: t('permission_viewNamedBip32PublicKeys', [
            <span className="permission-label-item" key={path.join('/')}>
              {friendlyName}
            </span>,
            path.join('/'),
          ]),
        };
      }

      return {
        ...baseDescription,
        label: t('permission_viewBip32PublicKeys', [
          <span className="permission-label-item" key={path.join('/')}>
            {path.join('/')}
          </span>,
          curve,
        ]),
      };
    }),
  [RestrictedMethods.snap_getBip32Entropy]: (t, _, permissionValue) =>
    permissionValue.caveats[0].value.map(({ path, curve }) => {
      const baseDescription = {
        leftIcon: 'fas fa-door-open',
        rightIcon: null,
        weight: 1,
      };

      const friendlyName = getSnapDerivationPathName(path, curve);
      if (friendlyName) {
        return {
          ...baseDescription,
          label: t('permission_manageNamedBip32Keys', [
            <span className="permission-label-item" key={path.join('/')}>
              {friendlyName}
            </span>,
            path.join('/'),
          ]),
        };
      }

      return {
        ...baseDescription,
        label: t('permission_manageBip32Keys', [
          <span className="permission-label-item" key={path.join('/')}>
            {path.join('/')}
          </span>,
          curve,
        ]),
      };
    }),
  [RestrictedMethods.snap_getBip44Entropy]: (t, _, permissionValue) =>
    permissionValue.caveats[0].value.map(({ coinType }) => ({
      label: t('permission_manageBip44Keys', [
        <span className="permission-label-item" key={`coin-type-${coinType}`}>
          {coinTypeToProtocolName(coinType) ||
            `${coinType} (Unrecognized protocol)`}
        </span>,
      ]),
      leftIcon: 'fas fa-door-open',
      rightIcon: null,
      weight: 1,
    })),
  [RestrictedMethods.snap_getEntropy]: (t) => ({
    label: t('permission_getEntropy'),
    leftIcon: 'fas fa-key',
    rightIcon: null,
    weight: 3,
  }),
  [RestrictedMethods.snap_manageState]: (t) => ({
    label: t('permission_manageState'),
    leftIcon: 'fas fa-download',
    rightIcon: null,
    weight: 3,
  }),
  [RestrictedMethods['wallet_snap_*']]: (t, permissionName) => {
    const baseDescription = {
      leftIcon: 'fas fa-bolt',
      rightIcon: null,
    };

    const snapId = permissionName.split('_').slice(-1);
    const friendlyName = SNAPS_METADATA[snapId]?.name;

    if (friendlyName) {
      return {
        ...baseDescription,
        label: t('permission_accessNamedSnap', [
          <span className="permission-label-item" key={snapId}>
            {friendlyName}
          </span>,
        ]),
      };
    }

    return {
      ...baseDescription,
      label: t('permission_accessSnap', [snapId]),
    };
  },
  [EndowmentPermissions['endowment:network-access']]: (t) => ({
    label: t('permission_accessNetwork'),
    leftIcon: 'fas fa-wifi',
    rightIcon: null,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:long-running']]: (t) => ({
    label: t('permission_longRunning'),
    leftIcon: 'fas fa-infinity',
    rightIcon: null,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:transaction-insight']]: (
    t,
    _,
    permissionValue,
  ) => {
    const baseDescription = {
      leftIcon: 'fas fa-info',
      rightIcon: null,
    };

    const result = [
      {
        ...baseDescription,
        label: t('permission_transactionInsight'),
      },
    ];

    if (
      isNonEmptyArray(permissionValue.caveats) &&
      permissionValue.caveats[0].type === SnapCaveatType.TransactionOrigin &&
      permissionValue.caveats[0].value
    ) {
      result.push({
        ...baseDescription,
        label: t('permission_transactionInsightOrigin'),
        leftIcon: 'fas fa-compass',
      });
    }

    return result;
  },
  [EndowmentPermissions['endowment:cronjob']]: (t) => ({
    label: t('permission_cronjob'),
    leftIcon: 'fas fa-clock',
    rightIcon: null,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:ethereum-provider']]: (t) => ({
    label: t('permission_ethereumProvider'),
    leftIcon: 'fab fa-ethereum',
    rightIcon: null,
    weight: 1,
  }),
  [EndowmentPermissions['endowment:rpc']]: (t, _, permissionValue) => {
    const { snaps, dapps } = getRpcCaveatOrigins(permissionValue);

    const labels = [];
    if (snaps) {
      labels.push(t('permission_rpc', [t('otherSnaps')]));
    }

    if (dapps) {
      labels.push(t('permission_rpc', [t('websites')]));
    }

    return labels.map((label) => ({
      label,
      leftIcon: 'fas fa-plug',
      rightIcon: null,
      weight: 2,
    }));
  },
  ///: END:ONLY_INCLUDE_IN
  [UNKNOWN_PERMISSION]: (t, permissionName) => ({
    label: t('permission_unknown', [permissionName ?? 'undefined']),
    leftIcon: 'fas fa-times-circle',
    rightIcon: null,
    weight: 4,
  }),
});

/**
 * @typedef {object} PermissionLabelObject
 * @property {string} label - The text label.
 * @property {string} leftIcon - The left icon.
 * @property {string} rightIcon - The right icon.
 * @property {number} weight - The weight of the permission.
 * @property {string} permissionName - The name of the permission.
 * @property {string} permissionValue - The raw value of the permission.
 */

/**
 * @param {Function} t - The translation function
 * @param {string} permissionName - The name of the permission to request
 * @param {object} permissionValue - The value of the permission to request
 * @returns {PermissionLabelObject[]}
 */
export const getPermissionDescription = (
  t,
  permissionName,
  permissionValue,
) => {
  let value = PERMISSION_DESCRIPTIONS[UNKNOWN_PERMISSION];

  if (Object.hasOwnProperty.call(PERMISSION_DESCRIPTIONS, permissionName)) {
    value = PERMISSION_DESCRIPTIONS[permissionName];
  }
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  for (const namespace of Object.keys(PermissionNamespaces)) {
    if (permissionName.startsWith(namespace)) {
      value = PERMISSION_DESCRIPTIONS[PermissionNamespaces[namespace]];
    }
  }
  ///: END:ONLY_INCLUDE_IN

  const result = value(t, permissionName, permissionValue);
  if (!Array.isArray(result)) {
    return [{ ...result, permissionName, permissionValue }];
  }

  return result.map((item) => ({
    ...item,
    permissionName,
    permissionValue,
  }));
};

/**
 * Get the weighted permissions from a permissions object. The weight is used to
 * sort the permissions in the UI.
 *
 * @param {Function} t - The translation function
 * @param {object} permissions - The permissions object.
 * @returns {PermissionLabelObject[]}
 */
export function getWeightedPermissions(t, permissions) {
  return Object.entries(permissions)
    .reduce(
      (target, [permissionName, permissionValue]) =>
        target.concat(
          getPermissionDescription(t, permissionName, permissionValue),
        ),
      [],
    )
    .sort((left, right) => left.weight - right.weight);
}
