import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import PermissionsConnectFooter from '../../../../components/app/permissions-connect-footer';
import PermissionConnectHeader from '../../../../components/app/permissions-connect-header';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SnapInstallWarning from '../../../../components/app/flask/snap-install-warning';
import Box from '../../../../components/ui/box/box';
import {
  AlignItems,
  BLOCK_SIZES,
  BorderStyle,
  FLEX_DIRECTION,
  JustifyContent,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';
import Typography from '../../../../components/ui/typography';
import UpdateSnapPermissionList from '../../../../components/app/flask/update-snap-permission-list';
import { getSnapInstallWarnings } from '../util';

export default function SnapUpdate({
  request,
  approveSnapUpdate,
  rejectSnapUpdate,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const [isShowingWarning, setIsShowingWarning] = useState(false);

  const onCancel = useCallback(
    () => rejectSnapUpdate(request.metadata.id),
    [request, rejectSnapUpdate],
  );

  const onSubmit = useCallback(
    () => approveSnapUpdate(request.metadata.id),
    [request, approveSnapUpdate],
  );

  const approvedPermissions = request.approvedPermissions ?? {};
  const revokedPermissions = request.unusedPermissions ?? {};
  const newPermissions = request.newPermissions ?? {};
  const hasPermissions =
    Object.keys(approvedPermissions).length +
      Object.keys(revokedPermissions).length +
      Object.keys(newPermissions).length >
    0;

  const warnings = getSnapInstallWarnings(
    newPermissions,
    targetSubjectMetadata,
    t,
  );

  const shouldShowWarning = warnings.length > 0;

  return (
    <Box
      className="page-container snap-update"
      justifyContent={JustifyContent.spaceBetween}
      height={BLOCK_SIZES.FULL}
      borderStyle={BorderStyle.none}
      flexDirection={FLEX_DIRECTION.COLUMN}
    >
      <Box
        className="headers"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <PermissionConnectHeader
          icon={targetSubjectMetadata.iconUrl}
          iconName={targetSubjectMetadata.name}
          headerTitle={t('snapUpdate')}
          headerText={null} // TODO(ritave): Add header text when snaps support description
          siteOrigin={request.snapId}
          isSnapInstallOrUpdate
          snapVersion={request.newVersion}
          boxProps={{ alignItems: AlignItems.center }}
        />
        <Typography
          boxProps={{
            padding: [4, 4, 0, 4],
          }}
          variant={TypographyVariant.H7}
          as="span"
        >
          {t('snapUpdateExplanation', [`${request.metadata.dappOrigin}`])}
        </Typography>
        {hasPermissions && (
          <>
            <Typography
              boxProps={{
                padding: [2, 4, 0, 4],
              }}
              variant={TypographyVariant.H7}
              as="span"
            >
              {t('snapRequestsPermission')}
            </Typography>
            <UpdateSnapPermissionList
              approvedPermissions={approvedPermissions}
              revokedPermissions={revokedPermissions}
              newPermissions={newPermissions}
            />
          </>
        )}
      </Box>
      <Box
        className="footers"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box className="snap-update__footer--no-source-code" paddingTop={4}>
          <PermissionsConnectFooter />
        </Box>
        <PageContainerFooter
          cancelButtonType="default"
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={
            shouldShowWarning ? () => setIsShowingWarning(true) : onSubmit
          }
          submitText={t('approveAndUpdate')}
        />
      </Box>
      {isShowingWarning && (
        <SnapInstallWarning
          onCancel={() => setIsShowingWarning(false)}
          onSubmit={onSubmit}
          snapName={targetSubjectMetadata.name}
          warnings={warnings}
        />
      )}
    </Box>
  );
}

SnapUpdate.propTypes = {
  request: PropTypes.object.isRequired,
  approveSnapUpdate: PropTypes.func.isRequired,
  rejectSnapUpdate: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string.isRequired,
    sourceCode: PropTypes.string,
    version: PropTypes.string,
  }).isRequired,
};
