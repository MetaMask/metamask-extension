import deepFreeze from 'deep-freeze-strict';
import React from 'react';

///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { getRpcCaveatOrigins } from '@metamask/snaps-controllers';
import { SnapCaveatType } from '@metamask/snaps-utils';
import { isNonEmptyArray } from '@metamask/controller-utils';
///: END:ONLY_INCLUDE_IF
import classnames from 'classnames';
import {
  RestrictedMethods,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  EndowmentPermissions,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/permissions';
import Tooltip from '../../components/ui/tooltip';
import {
  AvatarIcon,
  AvatarIconSize,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  Icon,
  Text,
  ///: END:ONLY_INCLUDE_IF
  IconName,
  IconSize,
} from '../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import {
  FontWeight,
  IconColor,
  TextColor,
  TextVariant,
} from '../constants/design-system';
import {
  coinTypeToProtocolName,
  getSnapDerivationPathName,
  getSnapName,
} from './util';
///: END:ONLY_INCLUDE_IF

const UNKNOWN_PERMISSION = Symbol('unknown');

///: BEGIN:ONLY_INCLUDE_IF(snaps)
const RIGHT_INFO_ICON = (
  <Icon name={IconName.Info} size={IconSize.Sm} color={IconColor.iconMuted} />
);
///: END:ONLY_INCLUDE_IF

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

function getSnapNameComponent(targetSubjectMetadata) {
  return (
    <Text
      fontWeight={FontWeight.Medium}
      variant={TextVariant.inherit}
      color={TextColor.inherit}
    >
      {getSnapName(targetSubjectMetadata?.origin, targetSubjectMetadata)}
    </Text>
  );
}

export const PERMISSION_DESCRIPTIONS = deepFreeze({
  [RestrictedMethods.eth_accounts]: ({ t }) => ({
    label: t('permission_ethereumAccounts'),
    leftIcon: getLeftIcon(IconName.Eye),
    rightIcon: null,
    weight: 3,
  }),
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  [RestrictedMethods.snap_dialog]: ({ t, targetSubjectMetadata }) => ({
    label: t('permission_dialog'),
    description: t('permission_dialogDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Messages,
    weight: 4,
  }),
  [RestrictedMethods.snap_notify]: ({ t, targetSubjectMetadata }) => ({
    label: t('permission_notifications'),
    description: t('permission_notificationsDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Notification,
    weight: 4,
  }),
  [RestrictedMethods.snap_getBip32PublicKey]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) =>
    permissionValue.caveats[0].value.map(({ path, curve }, i) => {
      const baseDescription = {
        leftIcon: IconName.SecuritySearch,
        weight: 2,
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
          getSnapNameComponent(targetSubjectMetadata),
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
            getSnapNameComponent(targetSubjectMetadata),
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
          getSnapNameComponent(targetSubjectMetadata),
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
        getSnapNameComponent(targetSubjectMetadata),
      ]),
      leftIcon: IconName.Key,
      weight: 1,
      id: `key-access-bip44-${coinType}-${i}`,
      warningMessageSubject:
        coinTypeToProtocolName(coinType) ||
        `${t('unknownNetworkForKeyEntropy')} m/44'/${coinType}'`,
    })),
  [RestrictedMethods.snap_getEntropy]: ({ t, targetSubjectMetadata }) => ({
    label: t('permission_getEntropy', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    description: t('permission_getEntropyDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.SecurityKey,
    weight: 4,
  }),

  [RestrictedMethods.snap_manageState]: ({ t, targetSubjectMetadata }) => ({
    label: t('permission_manageState'),
    description: t('permission_manageStateDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.AddSquare,
    weight: 4,
  }),
  [RestrictedMethods.snap_getLocale]: ({ t, targetSubjectMetadata }) => ({
    label: t('permission_getLocale'),
    description: t('permission_getLocaleDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Global,
    weight: 4,
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
  [EndowmentPermissions['endowment:network-access']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_accessNetwork'),
    description: t('permission_accessNetworkDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Wifi,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:webassembly']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_webAssembly'),
    description: t('permission_webAssemblyDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.DocumentCode,
    rightIcon: null,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:transaction-insight']]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) => {
    const baseDescription = {
      leftIcon: IconName.Speedometer,
      weight: 4,
    };

    const result = [
      {
        ...baseDescription,
        label: t('permission_transactionInsight'),
        description: t('permission_transactionInsightDescription', [
          getSnapNameComponent(targetSubjectMetadata),
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
          getSnapNameComponent(targetSubjectMetadata),
        ]),
        leftIcon: IconName.Explore,
      });
    }

    return result;
  },
  [EndowmentPermissions['endowment:cronjob']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_cronjob'),
    description: t('permission_cronjobDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Clock,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:ethereum-provider']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_ethereumProvider'),
    description: t('permission_ethereumProviderDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Ethereum,
    weight: 3,
    id: 'ethereum-provider-access',
    message: t('ethereumProviderAccess', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
  }),
  [EndowmentPermissions['endowment:rpc']]: ({
    t,
    permissionValue,
    targetSubjectMetadata,
  }) => {
    const baseDescription = {
      leftIcon: IconName.Hierarchy,
      weight: 3,
    };

    const { snaps, dapps, allowedOrigins } =
      getRpcCaveatOrigins(permissionValue);
    const results = [];
    if (snaps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [
          t('otherSnaps'),
          getSnapNameComponent(targetSubjectMetadata),
        ]),
        description: t('permission_rpcDescription', [
          t('otherSnaps'),
          getSnapNameComponent(targetSubjectMetadata),
        ]),
      });
    }

    if (dapps) {
      results.push({
        ...baseDescription,
        label: t('permission_rpc', [
          t('websites'),
          getSnapNameComponent(targetSubjectMetadata),
        ]),
        description: t('permission_rpcDescription', [
          t('websites'),
          getSnapNameComponent(targetSubjectMetadata),
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
          getSnapNameComponent(targetSubjectMetadata),
        ]),
        description: t('permission_rpcDescription', [
          originsMessage,
          getSnapNameComponent(targetSubjectMetadata),
        ]),
      });
    }

    return results;
  },
  [EndowmentPermissions['endowment:lifecycle-hooks']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_lifecycleHooks'),
    description: t('permission_lifecycleHooksDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: IconName.Hierarchy,
    weight: 4,
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
    weight: 4,
  }),
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  [RestrictedMethods.snap_manageAccounts]: ({ t, targetSubjectMetadata }) => ({
    label: t('permission_manageAccounts'),
    description: t('permission_manageAccountsDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: getLeftIcon(IconName.UserCircleAdd),
    rightIcon: null,
    weight: 3,
  }),
  [EndowmentPermissions['endowment:keyring']]: ({
    t,
    targetSubjectMetadata,
  }) => ({
    label: t('permission_keyring'),
    description: t('permission_keyringDescription', [
      getSnapNameComponent(targetSubjectMetadata),
    ]),
    leftIcon: getLeftIcon(IconName.UserCircleAdd),
    rightIcon: null,
    weight: 3,
  }),
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  [EndowmentPermissions['endowment:name-lookup']]: ({ t }) => ({
    label: t('permission_nameLookup'),
    description: t('permission_nameLookupDescription'),
    leftIcon: getLeftIcon(IconName.Search),
    weight: 4,
  }),
  ///: END:ONLY_INCLUDE_IF
  [UNKNOWN_PERMISSION]: ({ t, permissionName }) => ({
    label: t('permission_unknown', [permissionName ?? 'undefined']),
    leftIcon: getLeftIcon(IconName.Question),
    rightIcon: null,
    weight: 5,
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
