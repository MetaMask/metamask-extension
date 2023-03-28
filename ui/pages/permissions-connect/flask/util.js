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
  const bip32EntropyPermissions =
    permissions &&
    Object.entries(permissions)
      .filter(([key]) => key === 'snap_getBip32Entropy')
      .map(([, value]) => value);

  const bip44EntropyPermissions =
    permissions &&
    Object.entries(permissions)
      .filter(([key]) => key === 'snap_getBip44Entropy')
      .map(([, value]) => value);

  return [
    ...bip32EntropyPermissions.flatMap((permission, i) =>
      permission.caveats[0].value.map(({ path, curve }) => ({
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
    ),
    ...bip44EntropyPermissions.flatMap((permission, i) =>
      permission.caveats[0].value.map(({ coinType }) => ({
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
    ),
  ];
}
