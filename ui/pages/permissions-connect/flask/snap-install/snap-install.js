import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import PermissionsConnectPermissionList from '../../../../components/app/permissions-connect-permission-list';
import PermissionsConnectFooter from '../../../../components/app/permissions-connect-footer';
import PermissionConnectHeader from '../../../../components/app/permissions-connect-header';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SnapInstallWarning from '../../../../components/app/flask/snap-install-warning';
import Box from '../../../../components/ui/box/box';
import {
  ALIGN_ITEMS,
  BLOCK_SIZES,
  BORDER_STYLE,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import Typography from '../../../../components/ui/typography';
import { coinTypeToProtocolName } from '../../../../helpers/utils/util';

export default function SnapInstall({
  request,
  approveSnapInstall,
  rejectSnapInstall,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const [isShowingWarning, setIsShowingWarning] = useState(false);

  const onCancel = useCallback(
    () => rejectSnapInstall(request.metadata.id),
    [request, rejectSnapInstall],
  );

  const onSubmit = useCallback(
    () => approveSnapInstall(request),
    [request, approveSnapInstall],
  );

  const bip44EntropyPermissions =
    request.permissions &&
    Object.keys(request.permissions).filter((v) =>
      v.startsWith('snap_getBip44Entropy_'),
    );

  const bip32EntropyPermissions =
    request.permissions &&
    Object.entries(request.permissions)
      .filter(([key]) => key === 'snap_getBip32Entropy')
      .map(([, value]) => value);

  const shouldShowWarning =
    bip32EntropyPermissions?.length > 0 || bip44EntropyPermissions?.length > 0;

  const getCoinType = (bip44EntropyPermission) =>
    bip44EntropyPermission?.split('_').slice(-1);

  return (
    <Box
      className="page-container snap-install"
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
      height={BLOCK_SIZES.FULL}
      borderStyle={BORDER_STYLE.NONE}
      flexDirection={FLEX_DIRECTION.COLUMN}
    >
      <Box
        className="headers"
        alignItems={ALIGN_ITEMS.CENTER}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <PermissionConnectHeader
          icon={targetSubjectMetadata.iconUrl}
          iconName={targetSubjectMetadata.name}
          headerTitle={t('snapInstall')}
          headerText={null} // TODO(ritave): Add header text when snaps support description
          siteOrigin={targetSubjectMetadata.origin}
          isSnapInstallOrUpdate
          snapVersion={targetSubjectMetadata.version}
          boxProps={{ alignItems: ALIGN_ITEMS.CENTER }}
        />
        <Typography
          boxProps={{
            padding: [4, 4, 0, 4],
          }}
          variant={TYPOGRAPHY.H7}
          as="span"
        >
          {t('snapRequestsPermission')}
        </Typography>
        <PermissionsConnectPermissionList
          permissions={request.permissions || {}}
        />
      </Box>
      <Box
        className="footers"
        alignItems={ALIGN_ITEMS.CENTER}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box className="snap-install__footer--no-source-code" paddingTop={4}>
          <PermissionsConnectFooter />
        </Box>
        <PageContainerFooter
          cancelButtonType="default"
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={
            shouldShowWarning ? () => setIsShowingWarning(true) : onSubmit
          }
          submitText={t('approveAndInstall')}
        />
      </Box>
      {isShowingWarning && (
        <SnapInstallWarning
          onCancel={() => setIsShowingWarning(false)}
          onSubmit={onSubmit}
          warnings={[
            ...bip32EntropyPermissions.flatMap((permission, i) =>
              permission.caveats[0].value.map(({ path, curve }) => ({
                id: `key-access-bip32-${path.join('/')}-${curve}-${i}`,
                message: t('snapInstallWarningKeyAccess', [
                  targetSubjectMetadata.name,
                  `${path.join('/')} (${curve})`,
                ]),
              })),
            ),
            ...bip44EntropyPermissions.map((permission, i) => {
              const coinType = getCoinType(permission);
              return {
                id: `key-access-bip44-${i}`,
                message: t('snapInstallWarningKeyAccess', [
                  targetSubjectMetadata.name,
                  coinTypeToProtocolName(coinType) ||
                    t('unrecognizedProtocol', [coinType]),
                ]),
              };
            }),
          ]}
        />
      )}
    </Box>
  );
}

SnapInstall.propTypes = {
  request: PropTypes.object.isRequired,
  approveSnapInstall: PropTypes.func.isRequired,
  rejectSnapInstall: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string.isRequired,
    sourceCode: PropTypes.string,
    version: PropTypes.string,
  }).isRequired,
};
