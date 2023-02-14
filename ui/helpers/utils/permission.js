import deepFreeze from 'deep-freeze-strict';
import React from 'react';

///: BEGIN:ONLY_INCLUDE_IN(flask)
import { getRpcCaveatOrigins } from '@metamask/snaps-controllers/dist/snaps/endowments/rpc';
import { SnapCaveatType } from '@metamask/snaps-utils';
import { isNonEmptyArray } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IN
import classnames from 'classnames';
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  EndowmentPermissions,
  ///: END:ONLY_INCLUDE_IN
} from '../../../shared/constants/permissions';
import Tooltip from '../../components/ui/tooltip';
import { Icon, ICON_NAMES } from '../../components/component-library';
import { Color } from '../constants/design-system';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import {
  coinTypeToProtocolName,
  getSnapDerivationPathName,
  getSnapName,
} from './util';
///: END:ONLY_INCLUDE_IN

const UNKNOWN_PERMISSION = Symbol('unknown');

const PERMISSION_DESCRIPTIONS = deepFreeze({
  [RestrictedMethods.eth_accounts]: (t) => ({
    label: t('permission_ethereumAccounts'),
    leftIcon: (
      <Icon name={ICON_NAMES.EYE} margin={4} color={Color.iconAlternative} />
    ),
    rightIcon: null,
    weight: 2,
  }),
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  [RestrictedMethods.snap_confirm]: (t) => ({
    label: t('permission_customConfirmation'),
    description: t('permission_customConfirmationDescription'),
    leftIcon: 'fas fa-user-check',
    rightIcon: 'fas fa-info-circle',
    weight: 3,
  }),
  [RestrictedMethods.snap_dialog]: (t) => ({
    label: t('permission_dialog'),
    description: t('permission_dialogDescription'),
    leftIcon: 'fas fa-user-check',
    rightIcon: 'fas fa-info-circle',
    weight: 3,
  }),
  [RestrictedMethods.snap_notify]: (t) => ({
    label: t('permission_notifications'),
    description: t('permission_notificationsDescription'),
    leftIcon: <Icon name={ICON_NAMES.NOTIFICATION} />,
    rightIcon: 'fas fa-info-circle',
    weight: 3,
  }),
  [RestrictedMethods.snap_getBip32PublicKey]: (t, _, permissionValue) =>
    permissionValue.caveats[0].value.map(({ path, curve }) => {
      const baseDescription = {
        leftIcon: (
          <Icon
            name={ICON_NAMES.EYE}
            margin={4}
            color={Color.iconAlternative}
          />
        ),
        rightIcon: 'fa fa-exclamation-triangle',
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
          description: t('permission_viewNamedBip32PublicKeysDescription'),
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
        description: t('permission_viewNamedBip32PublicKeysDescription'),
      };
    }),
  [RestrictedMethods.snap_getBip32Entropy]: (t, _, permissionValue) =>
    permissionValue.caveats[0].value.map(({ path, curve }) => {
      const baseDescription = {
        leftIcon: 'fas fa-door-open',
        rightIcon: 'fa fa-exclamation-triangle',
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
          description: t('permission_manageNamedBip32KeysDescription'),
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
        description: t('permission_manageBip32KeysDescription'),
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
      description: t('permission_manageBip44KeysDescription'),
      leftIcon: 'fas fa-door-open',
      rightIcon: 'fa fa-exclamation-triangle',
      weight: 1,
    })),
  [RestrictedMethods.snap_getEntropy]: (t) => ({
    label: t('permission_getEntropy'),
    description: t('permission_getEntropyDescription'),
    leftIcon: 'fas fa-key',
    rightIcon: 'fas fa-info-circle',
    weight: 3,
  }),
  [RestrictedMethods.snap_manageState]: (t) => ({
    label: t('permission_manageState'),
    description: t('permission_manageStateDescription'),
    leftIcon: 'fas fa-download',
    rightIcon: 'fas fa-info-circle',
    weight: 3,
  }),
  [RestrictedMethods.wallet_snap]: (t, _, permissionValue) => {
    const snaps = permissionValue.caveats[0].value;
    const baseDescription = {
      leftIcon: 'fas fa-bolt',
      rightIcon: 'fas fa-info-circle',
    };

    return Object.keys(snaps).map((snapId) => {
      const friendlyName = getSnapName(snapId);
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
    });
  },
  [EndowmentPermissions['endowment:network-access']]: (t) => ({
    label: t('permission_accessNetwork'),
    description: t('permission_accessNetworkDescription'),
    leftIcon: 'fas fa-wifi',
    rightIcon: 'fas fa-info-circle',
    weight: 2,
  }),
  [EndowmentPermissions['endowment:webassembly']]: (t) => ({
    label: t('permission_webAssembly'),
    leftIcon: 'fas fa-microchip',
    rightIcon: null,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:long-running']]: (t) => ({
    label: t('permission_longRunning'),
    description: t('permission_longRunningDescription'),
    leftIcon: 'fas fa-infinity',
    rightIcon: 'fas fa-info-circle',
    weight: 3,
  }),
  [EndowmentPermissions['endowment:transaction-insight']]: (
    t,
    _,
    permissionValue,
  ) => {
    const baseDescription = {
      leftIcon: 'fas fa-info',
      rightIcon: 'fas fa-info-circle',
      weight: 3,
    };

    const result = [
      {
        ...baseDescription,
        label: t('permission_transactionInsight'),
        description: t('permission_transactionInsightDescription'),
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
        description: t('permission_transactionInsightOriginDescription'),
        leftIcon: 'fas fa-compass',
      });
    }

    return result;
  },
  [EndowmentPermissions['endowment:cronjob']]: (t) => ({
    label: t('permission_cronjob'),
    description: t('permission_cronjobDescription'),
    leftIcon: 'fas fa-clock',
    rightIcon: 'fas fa-info-circle',
    weight: 2,
  }),
  [EndowmentPermissions['endowment:ethereum-provider']]: (t) => ({
    label: t('permission_ethereumProvider'),
    description: t('permission_ethereumProviderDescription'),
    leftIcon: 'fab fa-ethereum',
    rightIcon: 'fas fa-info-circle',
    weight: 1,
  }),
  [EndowmentPermissions['endowment:rpc']]: (t, _, permissionValue) => {
    const baseDescription = {
      leftIcon: 'fas fa-plug',
      rightIcon: 'fas fa-info-circle',
      weight: 2,
    };

    const { snaps, dapps } = getRpcCaveatOrigins(permissionValue);

    const results = [];
    if (snaps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [t('otherSnaps')]),
        description: t('permission_rpcDescription'),
      });
    }

    if (dapps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [t('websites')]),
        description: t('permission_rpcDescription'),
      });
    }

    return results;
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
 * @property {string} [description] - An optional description, shown when the
 * `rightIcon` is hovered.
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

/**
 * Get the right icon for a permission. If a description is provided, the icon
 * will be wrapped in a tooltip. Otherwise, the icon will be rendered as-is. If
 * there's no right icon, this function will return null.
 *
 * If the weight is 1, the icon will be rendered with a warning color.
 *
 * @param {PermissionLabelObject} permission - The permission object.
 * @param {string} permission.rightIcon - The right icon.
 * @param {string} permission.description - The description.
 * @param {number} permission.weight - The weight.
 * @returns {JSX.Element | null} The right icon, or null if there's no
 * right icon.
 */
export function getRightIcon({ rightIcon, description, weight }) {
  if (rightIcon && description) {
    return (
      <Tooltip
        wrapperClassName={classnames(
          'permission__tooltip-icon',
          weight === 1 && 'permission__tooltip-icon__warning',
        )}
        html={description}
      >
        <i className={rightIcon} />
      </Tooltip>
    );
  }

  if (rightIcon) {
    return <i className={classnames(rightIcon, 'permission__tooltip-icon')} />;
  }

  return null;
}
