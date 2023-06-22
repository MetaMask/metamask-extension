import deepFreeze from 'deep-freeze-strict';
import React from 'react';

///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { getRpcCaveatOrigins } from '@metamask/snaps-controllers/dist/snaps/endowments/rpc';
import { SnapCaveatType } from '@metamask/snaps-utils';
import { isNonEmptyArray } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IN
import classnames from 'classnames';
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  EndowmentPermissions,
  ///: END:ONLY_INCLUDE_IN
} from '../../../shared/constants/permissions';
import Tooltip from '../../components/ui/tooltip';
import {
  AvatarIcon,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  Text,
  Icon,
  ///: END:ONLY_INCLUDE_IN
  IconName,
  IconSize,
} from '../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { Color, FontWeight, IconColor } from '../constants/design-system';
import {
  coinTypeToProtocolName,
  getSnapDerivationPathName,
  getSnapName,
} from './util';
///: END:ONLY_INCLUDE_IN

const UNKNOWN_PERMISSION = Symbol('unknown');

///: BEGIN:ONLY_INCLUDE_IN(snaps)
const RIGHT_INFO_ICON = (
  <Icon name={IconName.Info} size={IconSize.Sm} color={IconColor.iconMuted} />
);
///: END:ONLY_INCLUDE_IN

function getLeftIcon(iconName) {
  return (
    <AvatarIcon
      iconName={iconName}
      size={IconSize.Sm}
      iconProps={{
        size: IconSize.Xs,
      }}
    />
  );
}

export const PERMISSION_DESCRIPTIONS = deepFreeze({
  [RestrictedMethods.eth_accounts]: ({ t }) => ({
    label: t('permission_ethereumAccounts'),
    leftIcon: getLeftIcon(IconName.Eye),
    rightIcon: null,
    weight: 2,
  }),
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  [RestrictedMethods.snap_dialog]: ({ t }) => ({
    label: t('permission_dialog'),
    description: t('permission_dialogDescription'),
    leftIcon: IconName.Messages,
    weight: 3,
  }),
  [RestrictedMethods.snap_notify]: ({ t }) => ({
    label: t('permission_notifications'),
    description: t('permission_notificationsDescription'),
    leftIcon: IconName.Notification,
    weight: 3,
  }),
  [RestrictedMethods.snap_getBip32PublicKey]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) =>
    permissionValue.caveats[0].value.map(({ path, curve }, i) => {
      const baseDescription = {
        leftIcon: IconName.SecuritySearch,
        weight: 1,
        id: `public-key-access-bip32-${path
          .join('-')
          ?.replace(/'/gu, 'h')}-${curve}-${i}`,
        message: t('snapInstallWarningPublicKeyAccess', [
          <Text
            key="1"
            color={Color.primaryDefault}
            fontWeight={FontWeight.Medium}
            as="span"
          >
            {getSnapName(targetSubjectMetadata?.origin, targetSubjectMetadata)}
          </Text>,
          <Text as="span" key="2" fontWeight={FontWeight.Medium}>
            {getSnapDerivationPathName(path, curve) ??
              `${path.join('/')} (${curve})`}
          </Text>,
        ]),
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
          description: t('permission_viewBip32PublicKeysDescription', [
            <span
              className="tooltip-label-item"
              key={`description-${path.join('/')}`}
            >
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
        description: t('permission_viewBip32PublicKeysDescription', [
          <span
            className="tooltip-label-item"
            key={`description-${path.join('/')}`}
          >
            {path.join('/')}
          </span>,
          path.join('/'),
        ]),
      };
    }),
  [RestrictedMethods.snap_getBip32Entropy]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) =>
    permissionValue.caveats[0].value.map(({ path, curve }, i) => {
      const baseDescription = {
        leftIcon: IconName.Key,
        weight: 1,
        id: `key-access-bip32-${path
          .join('-')
          ?.replace(/'/gu, 'h')}-${curve}-${i}`,
        message: t('snapInstallWarningKeyAccess', [
          <Text
            key="1"
            color={Color.primaryDefault}
            fontWeight={FontWeight.Medium}
            as="span"
          >
            {getSnapName(targetSubjectMetadata?.origin, targetSubjectMetadata)}
          </Text>,
          <Text as="span" key="2" fontWeight={FontWeight.Medium}>
            {getSnapDerivationPathName(path, curve) ??
              `${path.join('/')} (${curve})`}
          </Text>,
        ]),
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
          description: t('permission_manageBip32KeysDescription', [
            <span
              className="tooltip-label-item"
              key={`description-${path.join('/')}`}
            >
              {friendlyName}
            </span>,
            curve,
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
        description: t('permission_manageBip32KeysDescription', [
          <span
            className="tooltip-label-item"
            key={`description-${path.join('/')}`}
          >
            {path.join('/')}
          </span>,
          curve,
        ]),
      };
    }),
  [RestrictedMethods.snap_getBip44Entropy]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) =>
    permissionValue.caveats[0].value.map(({ coinType }, i) => ({
      label: t('permission_manageBip44Keys', [
        <span className="permission-label-item" key={`coin-type-${coinType}`}>
          {coinTypeToProtocolName(coinType) ||
            t('unrecognizedProtocol', [coinType])}
        </span>,
      ]),
      description: t('permission_manageBip44KeysDescription', [
        <span
          className="tooltip-label-item"
          key={`description-coin-type-${coinType}`}
        >
          {coinTypeToProtocolName(coinType) ||
            t('unrecognizedProtocol', [coinType])}
        </span>,
      ]),
      leftIcon: IconName.Key,
      weight: 1,
      id: `key-access-bip44-${coinType}-${i}`,
      message: t('snapInstallWarningKeyAccess', [
        <Text
          key="1"
          color={Color.primaryDefault}
          fontWeight={FontWeight.Medium}
          as="span"
        >
          {getSnapName(targetSubjectMetadata?.origin, targetSubjectMetadata)}
        </Text>,
        <Text as="span" key="2" fontWeight={FontWeight.Medium}>
          {coinTypeToProtocolName(coinType) ||
            t('unrecognizedProtocol', [coinType])}
        </Text>,
      ]),
    })),
  [RestrictedMethods.snap_getEntropy]: ({ t }) => ({
    label: t('permission_getEntropy'),
    description: t('permission_getEntropyDescription'),
    leftIcon: IconName.SecurityKey,
    weight: 3,
  }),
  [RestrictedMethods.snap_manageState]: ({ t }) => ({
    label: t('permission_manageState'),
    description: t('permission_manageStateDescription'),
    leftIcon: IconName.AddSquare,
    weight: 3,
  }),
  [RestrictedMethods.wallet_snap]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) => {
    const snaps = permissionValue.caveats[0].value;
    const baseDescription = {
      leftIcon: getLeftIcon(IconName.Flash),
      rightIcon: RIGHT_INFO_ICON,
    };

    return Object.keys(snaps).map((snapId) => {
      const friendlyName = getSnapName(snapId, targetSubjectMetadata);
      if (friendlyName) {
        return {
          ...baseDescription,
          label: t('permission_accessNamedSnap', [
            <span className="permission-label-item" key={snapId}>
              {friendlyName}
            </span>,
          ]),
          description: t('permission_accessSnapDescription', [friendlyName]),
        };
      }

      return {
        ...baseDescription,
        label: t('permission_accessSnap', [snapId]),
        description: t('permission_accessSnapDescription', [snapId]),
      };
    });
  },
  [EndowmentPermissions['endowment:network-access']]: ({ t }) => ({
    label: t('permission_accessNetwork'),
    description: t('permission_accessNetworkDescription'),
    leftIcon: IconName.Global,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:webassembly']]: ({ t }) => ({
    label: t('permission_webAssembly'),
    description: t('permission_webAssemblyDescription'),
    leftIcon: IconName.DocumentCode,
    rightIcon: null,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:long-running']]: ({ t }) => ({
    label: t('permission_longRunning'),
    description: t('permission_longRunningDescription'),
    leftIcon: IconName.Link,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:transaction-insight']]: ({
    t,
    permissionValue,
  }) => {
    const baseDescription = {
      leftIcon: IconName.Speedometer,
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
        leftIcon: IconName.Explore,
      });
    }

    return result;
  },
  [EndowmentPermissions['endowment:cronjob']]: ({ t }) => ({
    label: t('permission_cronjob'),
    description: t('permission_cronjobDescription'),
    leftIcon: IconName.Clock,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:ethereum-provider']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_ethereumProvider'),
    description: t('permission_ethereumProviderDescription'),
    leftIcon: IconName.Ethereum,
    weight: 2,
    id: 'ethereum-provider-access',
    message: t('ethereumProviderAccess', [targetSubjectMetadata?.origin]),
  }),
  [EndowmentPermissions['endowment:rpc']]: ({ t, permissionValue }) => {
    const baseDescription = {
      leftIcon: IconName.Hierarchy,
      weight: 2,
    };

    const { snaps, dapps } = getRpcCaveatOrigins(permissionValue);

    const results = [];
    if (snaps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [t('otherSnaps')]),
        description: t('permission_rpcDescription', [t('otherSnaps')]),
      });
    }

    if (dapps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [t('websites')]),
        description: t('permission_rpcDescription', [t('websites')]),
      });
    }

    return results;
  },
  ///: END:ONLY_INCLUDE_IN
  [UNKNOWN_PERMISSION]: ({ t, permissionName }) => ({
    label: t('permission_unknown', [permissionName ?? 'undefined']),
    leftIcon: getLeftIcon(IconName.Question),
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
 * @typedef {object} PermissionDescriptionParamsObject
 * @property {Function} t - The translation function.
 * @property {string} permissionName - The name of the permission.
 * @property {object} permissionValue - The permission object.
 * @property {object} targetSubjectMetadata - Subject metadata.
 */

/**
 * @param {PermissionDescriptionParamsObject} params - The permission description params object.
 * @param {Function} params.t - The translation function.
 * @param {string} params.permissionName - The name of the permission to request
 * @param {object} params.permissionValue - The value of the permission to request
 * @returns {PermissionLabelObject[]}
 */
export const getPermissionDescription = ({
  t,
  permissionName,
  permissionValue,
  targetSubjectMetadata,
}) => {
  let value = PERMISSION_DESCRIPTIONS[UNKNOWN_PERMISSION];

  if (Object.hasOwnProperty.call(PERMISSION_DESCRIPTIONS, permissionName)) {
    value = PERMISSION_DESCRIPTIONS[permissionName];
  }

  const result = value({
    t,
    permissionName,
    permissionValue,
    targetSubjectMetadata,
  });
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
 * @param {object} targetSubjectMetadata - The subject metadata.
 * @returns {PermissionLabelObject[]}
 */
export function getWeightedPermissions(t, permissions, targetSubjectMetadata) {
  return Object.entries(permissions)
    .reduce(
      (target, [permissionName, permissionValue]) =>
        target.concat(
          getPermissionDescription({
            t,
            permissionName,
            permissionValue,
            targetSubjectMetadata,
          }),
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
 * @param {JSX.Element | string} permission.rightIcon - The right icon.
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
        html={<div>{description}</div>}
        position="bottom"
      >
        {typeof rightIcon === 'string' ? (
          <i className={rightIcon} />
        ) : (
          rightIcon
        )}
      </Tooltip>
    );
  }

  if (rightIcon) {
    if (typeof rightIcon === 'string') {
      return (
        <i className={classnames(rightIcon, 'permission__tooltip-icon')} />
      );
    }

    return rightIcon;
  }

  return null;
}
