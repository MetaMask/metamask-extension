import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import PermissionsConnectPermissionList from '../../../../components/app/permissions-connect-permission-list';
import PermissionsConnectFooter from '../../../../components/app/permissions-connect-footer';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SnapInstallWarning from '../../../../components/app/flask/snap-install-warning';
import Box from '../../../../components/ui/box/box';
import {
  AlignItems,
  BLOCK_SIZES,
  BorderStyle,
  FLEX_DIRECTION,
  JustifyContent,
  TextVariant,
  TEXT_ALIGN,
} from '../../../../helpers/constants/design-system';
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/flask/install-error/install-error';
import SnapsAuthorshipPill from '../../../../components/app/flask/snaps-authorship-pill/snaps-authorship-pill';
import { Text } from '../../../../components/component-library';
import { SNAPS_METADATA } from '../../../../../shared/constants/snaps';
import { stripProtocol } from '../../../../helpers/utils/util';

export default function SnapInstall({
  request,
  requestState,
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
    () => approveSnapInstall(request.metadata.id),
    [request, approveSnapInstall],
  );

  const hasError = !requestState.loading && requestState.error;

  const isLoading = requestState.loading;

  const hasPermissions =
    !hasError &&
    !isLoading &&
    requestState?.permissions &&
    Object.keys(requestState.permissions).length > 0;

  const warnings = getSnapInstallWarnings(
    requestState?.permissions ?? {},
    targetSubjectMetadata,
    t,
  );

  const shouldShowWarning = warnings.length > 0;

  const snapName =
    SNAPS_METADATA[targetSubjectMetadata.origin]?.name ??
    targetSubjectMetadata.origin;

  const handleSubmit = () => {
    if (!hasError && shouldShowWarning) {
      setIsShowingWarning(true);
    } else if (hasError) {
      onCancel();
    } else {
      onSubmit();
    }
  };

  return (
    <Box
      className="page-container snap-install"
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
        <SnapsAuthorshipPill
          snapId={targetSubjectMetadata.origin}
          version={targetSubjectMetadata.version}
        />
        <Text padding={[4, 4, 0, 4]} variant={TextVariant.headingLg}>
          {t('snapInstall')}
        </Text>
        {isLoading && (
          <Box
            className="loader-container"
            flexDirection={FLEX_DIRECTION.COLUMN}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <PulseLoader />
          </Box>
        )}
        {hasError && (
          <InstallError error={requestState.error} title={t('requestFailed')} />
        )}
        {hasPermissions && (
          <>
            <Text
              paddingLeft={4}
              paddingRight={4}
              textAlign={TEXT_ALIGN.CENTER}
            >
              {t('snapInstallRequestsPermission', [
                <b key="1">
                  {request.metadata?.dappOrigin &&
                    stripProtocol(request.metadata.dappOrigin)}
                </b>,
                <b key="2">{snapName}</b>,
              ])}
            </Text>
            <PermissionsConnectPermissionList
              permissions={requestState.permissions || {}}
            />
          </>
        )}
      </Box>
      <Box
        className="footers"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box className="snap-install__footer--no-source-code" paddingTop={4}>
          <PermissionsConnectFooter />
        </Box>
        <PageContainerFooter
          cancelButtonType="default"
          hideCancel={hasError}
          disabled={isLoading}
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={handleSubmit}
          submitText={t(
            // eslint-disable-next-line no-nested-ternary
            hasError ? 'ok' : hasPermissions ? 'approveAndInstall' : 'install',
          )}
        />
      </Box>
      {isShowingWarning && (
        <SnapInstallWarning
          onCancel={() => setIsShowingWarning(false)}
          onSubmit={onSubmit}
          warnings={warnings}
        />
      )}
    </Box>
  );
}

SnapInstall.propTypes = {
  request: PropTypes.object.isRequired,
  requestState: PropTypes.object.isRequired,
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
