import { isObject } from '@metamask/utils';
import React from 'react';
import { Text } from '../../../components/component-library';
import {
  Color,
  FONT_WEIGHT,
  TextVariant,
} from '../../../helpers/constants/design-system';

import {
  coinTypeToProtocolName,
  getSnapName,
  getSnapDerivationPathName,
} from '../../../helpers/utils/util';

export function getSnapInstallWarnings(permissions, targetSubjectMetadata, t) {
  if (!isObject(permissions)) {
    return [];
  }
  const bip32EntropyPermission = permissions.snap_getBip32Entropy ?? [];

  const bip44EntropyPermission = permissions.snap_getBip32Entropy ?? [];

  const bip32PublicKeyPermission = permissions.snap_getBip32PublicKey ?? [];

  const ethereumProviderPermission =
    permissions['endowment:ethereum-provider'] ?? [];

  if (
    Array.isArray(bip32EntropyPermission) &&
    Array.isArray(bip44EntropyPermission) &&
    Array.isArray(bip32EntropyPermission) &&
    Array.isArray(ethereumProviderPermission)
  ) {
    return [];
  }

  let ethereumProviderPermissionDescription = ethereumProviderPermission;

  if (isObject(ethereumProviderPermission)) {
    ethereumProviderPermissionDescription = [
      {
        id: 'ethereum-provider-access',
        message: t('ethereumProviderAccess'),
      },
    ];
  }

  return [
    ...bip32EntropyPermission.caveats[0].value.map(({ path, curve }, i) => ({
      id: `key-access-bip32-${path
        .join('-')
        .replace(/'/gu, 'h')}-${curve}-${i}`,
      message: t('snapInstallWarningKeyAccess', [
        <Text
          key="1"
          color={Color.primaryDefault}
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TextVariant.bodySm}
          as="span"
        >
          {getSnapName(targetSubjectMetadata.origin)}
        </Text>,
        <b key="2">
          {getSnapDerivationPathName(path, curve) ??
            `${path.join('/')} (${curve})`}
        </b>,
      ]),
    })),
    ...bip44EntropyPermission.caveats[0].value.map(({ coinType }, i) => ({
      id: `key-access-bip44-${coinType}-${i}`,
      message: t('snapInstallWarningKeyAccess', [
        <Text
          key="1"
          color={Color.primaryDefault}
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TextVariant.bodySm}
          as="span"
        >
          {getSnapName(targetSubjectMetadata.origin)}
        </Text>,
        <b key="2">
          {coinTypeToProtocolName(coinType) ||
            t('unrecognizedProtocol', [coinType])}
        </b>,
      ]),
    })),
    ...bip32PublicKeyPermission.caveats[0].value.map(({ path, curve }, i) => ({
      id: `public-key-access-bip32-${path
        .join('-')
        .replace(/'/gu, 'h')}-${curve}-${i}`,
      message: t('snapInstallWarningPublicKeyAccess', [
        <Text
          key="1"
          color={Color.primaryDefault}
          fontWeight={FONT_WEIGHT.BOLD}
          variant={TextVariant.bodySm}
          as="span"
        >
          {getSnapName(targetSubjectMetadata.origin)}
        </Text>,
        <b key="2">
          {getSnapDerivationPathName(path, curve) ??
            `${path.join('/')} (${curve})`}
        </b>,
      ]),
    })),
    ...ethereumProviderPermissionDescription,
  ];
}
