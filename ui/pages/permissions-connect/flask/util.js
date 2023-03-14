import { coinTypeToProtocolName } from '../../../helpers/utils/util';

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
          targetSubjectMetadata.name,
          `${path.join('/')} (${curve})`,
        ]),
      })),
    ),
    ...bip44EntropyPermissions.flatMap((permission, i) =>
      permission.caveats[0].value.map(({ coinType }) => ({
        id: `key-access-bip44-${coinType}-${i}`,
        message: t('snapInstallWarningKeyAccess', [
          targetSubjectMetadata.name,
          coinTypeToProtocolName(coinType) ||
            t('unrecognizedProtocol', [coinType]),
        ]),
      })),
    ),
  ];
}
