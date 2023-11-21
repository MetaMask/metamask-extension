import deepFreeze from 'deep-freeze-strict';
import React from 'react';

///: BEGIN:ONLY_INCLUDE_IN(snaps)
import { getRpcCaveatOrigins } from '@metamask/snaps-controllers';
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
  AvatarIconSize,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  Icon,
  Text,
  ///: END:ONLY_INCLUDE_IN
  IconName,
  IconSize,
} from '../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import {
  FontWeight,
  IconColor,
  TextColor,
  TextVariant,
} from '../constants/design-system';
import { coinTypeToProtocolName, getSnapDerivationPathName } from './util';
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
      size={AvatarIconSize.Sm}
      iconProps={{
        size: IconSize.Xs,
      }}
    />
  );
}

/**
 * Get a component for the Snap name.
 *
 * @param {string} snapName - The snap name.
 * @returns {JSX.Element} The Snap name component.
 */
function getSnapNameComponent(snapName) {
  return (
    <Text
      fontWeight={FontWeight.Medium}
      variant={TextVariant.inherit}
      color={TextColor.inherit}
    >
      {snapName}
    </Text>
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
  [RestrictedMethods.snap_dialog]: ({ t, snapName }) => ({
    label: t('permission_dialog'),
    description: t('permission_dialogDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Messages,
    weight: 3,
  }),
  [RestrictedMethods.snap_notify]: ({ t, snapName }) => ({
    label: t('permission_notifications'),
    description: t('permission_notificationsDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Notification,
    weight: 3,
  }),
  [RestrictedMethods.snap_getBip32PublicKey]: ({
    t,
    permissionValue,
    snapName,
  }) =>
    permissionValue.caveats[0].value.map(({ path, curve }, i) => {
      const baseDescription = {
        leftIcon: IconName.SecuritySearch,
        weight: 1,
        id: `public-key-access-bip32-${path
          .join('-')
          ?.replace(/'/gu, 'h')}-${curve}-${i}`,
        warningMessageSubject:
          getSnapDerivationPathName(path, curve) ??
          `${t('unknownNetworkForKeyEntropy')}  ${path.join('/')} (${curve})`,
      };

      const friendlyName = getSnapDerivationPathName(path, curve);
      if (friendlyName) {
        return {
          ...baseDescription,
          label: t('permission_viewNamedBip32PublicKeys', [
            <Text
              color={TextColor.inherit}
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
              key={path.join('/')}
            >
              {friendlyName}
            </Text>,
          ]),
          description: t('permission_viewBip32PublicKeysDescription', [
            <Text
              color={TextColor.inherit}
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
              key={`description-${path.join('/')}`}
            >
              {friendlyName}
            </Text>,
          ]),
        };
      }

      return {
        ...baseDescription,
        label: t('permission_viewBip32PublicKeys', [
          <Text
            color={TextColor.inherit}
            variant={TextVariant.inherit}
            fontWeight={FontWeight.Medium}
            key={path.join('/')}
          >
            {`${t('unknownNetworkForKeyEntropy')} `} {path.join('/')}
          </Text>,
          curve,
        ]),
        description: t('permission_viewBip32PublicKeysDescription', [
          <Text
            color={TextColor.inherit}
            variant={TextVariant.inherit}
            fontWeight={FontWeight.Medium}
            key={`description-${path.join('/')}`}
          >
            {path.join('/')}
          </Text>,
          getSnapNameComponent(snapName),
        ]),
      };
    }),
  [RestrictedMethods.snap_getBip32Entropy]: ({
    t,
    permissionValue,
    snapName,
  }) =>
    permissionValue.caveats[0].value.map(({ path, curve }, i) => {
      const baseDescription = {
        leftIcon: IconName.Key,
        weight: 1,
        id: `key-access-bip32-${path
          .join('-')
          ?.replace(/'/gu, 'h')}-${curve}-${i}`,
        warningMessageSubject:
          getSnapDerivationPathName(path, curve) ||
          `${t('unknownNetworkForKeyEntropy')} ${path.join('/')} (${curve})`,
      };

      const friendlyName = getSnapDerivationPathName(path, curve);
      if (friendlyName) {
        return {
          ...baseDescription,
          label: t('permission_manageBip32Keys', [
            <Text
              color={TextColor.inherit}
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
              key={path.join('/')}
            >
              {friendlyName}
            </Text>,
          ]),
          description: t('permission_manageBip44AndBip32KeysDescription', [
            getSnapNameComponent(snapName),
          ]),
        };
      }

      return {
        ...baseDescription,
        label: t('permission_manageBip32Keys', [
          <Text
            color={TextColor.inherit}
            variant={TextVariant.inherit}
            fontWeight={FontWeight.Medium}
            key={path.join('/')}
          >
            {`${t('unknownNetworkForKeyEntropy')} ${path.join('/')} (${curve})`}
          </Text>,
        ]),
        description: t('permission_manageBip44AndBip32KeysDescription', [
          getSnapNameComponent(snapName),
        ]),
      };
    }),
  [RestrictedMethods.snap_getBip44Entropy]: ({
    t,
    permissionValue,
    snapName,
  }) =>
    permissionValue.caveats[0].value.map(({ coinType }, i) => ({
      label: t('permission_manageBip44Keys', [
        <Text
          color={TextColor.inherit}
          variant={TextVariant.inherit}
          fontWeight={FontWeight.Medium}
          key={`coin-type-${coinType}`}
        >
          {coinTypeToProtocolName(coinType) ||
            `${t('unknownNetworkForKeyEntropy')} m/44'/${coinType}'`}
        </Text>,
      ]),
      description: t('permission_manageBip44AndBip32KeysDescription', [
        getSnapNameComponent(snapName),
      ]),
      leftIcon: IconName.Key,
      weight: 1,
      id: `key-access-bip44-${coinType}-${i}`,
      warningMessageSubject:
        coinTypeToProtocolName(coinType) ||
        `${t('unknownNetworkForKeyEntropy')} m/44'/${coinType}'`,
    })),
  [RestrictedMethods.snap_getEntropy]: ({ t, snapName }) => ({
    label: t('permission_getEntropy', [getSnapNameComponent(snapName)]),
    description: t('permission_getEntropyDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.SecurityKey,
    weight: 3,
  }),

  [RestrictedMethods.snap_manageState]: ({ t, snapName }) => ({
    label: t('permission_manageState'),
    description: t('permission_manageStateDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.AddSquare,
    weight: 3,
  }),
  [RestrictedMethods.snap_getLocale]: ({ t, snapName }) => ({
    label: t('permission_getLocale'),
    description: t('permission_getLocaleDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Global,
    weight: 3,
  }),
  [RestrictedMethods.wallet_snap]: ({ t, permissionValue, getSnapName }) => {
    const snaps = permissionValue.caveats[0].value;
    const baseDescription = {
      leftIcon: getLeftIcon(IconName.Flash),
      rightIcon: RIGHT_INFO_ICON,
    };

    return Object.keys(snaps).map((snapId) => {
      const friendlyName = getSnapName(snapId);
      if (friendlyName) {
        return {
          ...baseDescription,
          label: t('permission_accessNamedSnap', [
            <Text
              color={TextColor.inherit}
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
              key={snapId}
            >
              {friendlyName}
            </Text>,
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
  [EndowmentPermissions['endowment:network-access']]: ({ t, snapName }) => ({
    label: t('permission_accessNetwork'),
    description: t('permission_accessNetworkDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Wifi,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:webassembly']]: ({ t, snapName }) => ({
    label: t('permission_webAssembly'),
    description: t('permission_webAssemblyDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.DocumentCode,
    rightIcon: null,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:transaction-insight']]: ({
    t,
    permissionValue,
    snapName,
  }) => {
    const baseDescription = {
      leftIcon: IconName.Speedometer,
      weight: 3,
    };

    const result = [
      {
        ...baseDescription,
        label: t('permission_transactionInsight'),
        description: t('permission_transactionInsightDescription', [
          getSnapNameComponent(snapName),
        ]),
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
        description: t('permission_transactionInsightOriginDescription', [
          getSnapNameComponent(snapName),
        ]),
        leftIcon: IconName.Explore,
      });
    }

    return result;
  },
  [EndowmentPermissions['endowment:cronjob']]: ({ t, snapName }) => ({
    label: t('permission_cronjob'),
    description: t('permission_cronjobDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Clock,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:ethereum-provider']]: ({ t, snapName }) => ({
    label: t('permission_ethereumProvider'),
    description: t('permission_ethereumProviderDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Ethereum,
    weight: 2,
    id: 'ethereum-provider-access',
    message: t('ethereumProviderAccess', [getSnapNameComponent(snapName)]),
  }),
  [EndowmentPermissions['endowment:rpc']]: ({
    t,
    permissionValue,
    snapName,
  }) => {
    const baseDescription = {
      leftIcon: IconName.Hierarchy,
      weight: 2,
    };

    const { snaps, dapps, allowedOrigins } =
      getRpcCaveatOrigins(permissionValue);
    const results = [];
    if (snaps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [
          t('otherSnaps'),
          getSnapNameComponent(snapName),
        ]),
        description: t('permission_rpcDescription', [
          t('otherSnaps'),
          getSnapNameComponent(snapName),
        ]),
      });
    }

    if (dapps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [
          t('websites'),
          getSnapNameComponent(snapName),
        ]),
        description: t('permission_rpcDescription', [
          t('websites'),
          getSnapNameComponent(snapName),
        ]),
      });
    }

    if (allowedOrigins?.length > 0) {
      let originsMessage;

      if (allowedOrigins.length === 1) {
        originsMessage = (
          <Text
            color={TextColor.inherit}
            variant={TextVariant.inherit}
            fontWeight={FontWeight.Medium}
          >
            {allowedOrigins[0]}
          </Text>
        );
      } else {
        const lastOrigin = allowedOrigins.slice(-1);

        const originList = allowedOrigins.slice(0, -1).map((origin) => (
          <>
            <Text
              color={TextColor.inherit}
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Medium}
            >
              {origin}
            </Text>
            {', '}
          </>
        ));

        originsMessage = t('permission_rpcDescriptionOriginList', [
          originList,
          <Text
            color={TextColor.inherit}
            variant={TextVariant.inherit}
            fontWeight={FontWeight.Medium}
            key="2"
          >
            {lastOrigin}
          </Text>,
        ]);
      }
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [
          originsMessage,
          getSnapNameComponent(snapName),
        ]),
        description: t('permission_rpcDescription', [
          originsMessage,
          getSnapNameComponent(snapName),
        ]),
      });
    }

    return results;
  },
  [EndowmentPermissions['endowment:lifecycle-hooks']]: ({ t, snapName }) => ({
    label: t('permission_lifecycleHooks'),
    description: t('permission_lifecycleHooksDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: IconName.Hierarchy,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:page-home']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_homePage'),
    description: t('permission_homePageDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Home,
    weight: 3,
  }),
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  [RestrictedMethods.snap_manageAccounts]: ({ t, snapName }) => ({
    label: t('permission_manageAccounts'),
    description: t('permission_manageAccountsDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: getLeftIcon(IconName.UserCircleAdd),
    rightIcon: null,
    weight: 2,
  }),
  [EndowmentPermissions['endowment:keyring']]: ({ t, snapName }) => ({
    label: t('permission_keyring'),
    description: t('permission_keyringDescription', [
      getSnapNameComponent(snapName),
    ]),
    leftIcon: getLeftIcon(IconName.UserCircleAdd),
    rightIcon: null,
    weight: 2,
  }),
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
 * @param {object} params.targetSubjectMetadata - The subject metadata.
 * @param {string} params.snapName - The snap name.
 * @param {Function} [params.getSnapName] - The function to get the snap name
 * from a snap ID.
 * @returns {PermissionLabelObject[]}
 */
export const getPermissionDescription = ({
  t,
  permissionName,
  permissionValue,
  targetSubjectMetadata,
  snapName,
  getSnapName,
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
    snapName,
    getSnapName,
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
 * @param {string} [snapName] - The snap name.
 * @param {Function} [getSnapName] - The function to get the snap name from a
 * snap ID.
 * @returns {PermissionLabelObject[]}
 */
export function getWeightedPermissions(
  t,
  permissions,
  targetSubjectMetadata,
  snapName,
  getSnapName,
) {
  return Object.entries(permissions)
    .reduce(
      (target, [permissionName, permissionValue]) =>
        target.concat(
          getPermissionDescription({
            t,
            permissionName,
            permissionValue,
            targetSubjectMetadata,
            snapName,
            getSnapName,
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
