import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { PageContainerFooter } from '../../../../components/ui/page-container';
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

import UpdateSnapPermissionList from '../../../../components/app/flask/update-snap-permission-list';
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/flask/install-error/install-error';
import SnapsAuthorshipPill from '../../../../components/app/flask/snaps-authorship-pill/snaps-authorship-pill';
import { Text } from '../../../../components/component-library';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import { getSnapName } from '../../../../helpers/utils/util';

export default function SnapUpdate({
  request,
  requestState,
  approveSnapUpdate,
  rejectSnapUpdate,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const [isShowingWarning, setIsShowingWarning] = useState(false);
  const originMetadata = useOriginMetadata(request.metadata?.dappOrigin) || {};

  const onCancel = useCallback(
    () => rejectSnapUpdate(request.metadata.id),
    [request, rejectSnapUpdate],
  );

  const onSubmit = useCallback(
    () => approveSnapUpdate(request.metadata.id),
    [request, approveSnapUpdate],
  );

  const approvedPermissions = requestState.approvedPermissions ?? {};
  const revokedPermissions = requestState.unusedPermissions ?? {};
  const newPermissions = requestState.newPermissions ?? {};

  const isLoading = requestState.loading;
  const hasError = !isLoading && requestState.error;

  const hasPermissions =
    !hasError &&
    Object.keys(approvedPermissions).length +
      Object.keys(revokedPermissions).length +
      Object.keys(newPermissions).length >
      0;

  const isEmpty = !isLoading && !hasError && !hasPermissions;

  const warnings = getSnapInstallWarnings(
    newPermissions,
    targetSubjectMetadata,
    t,
  );

  const shouldShowWarning = warnings.length > 0;

  const snapName = getSnapName(targetSubjectMetadata.origin);

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
        <SnapsAuthorshipPill
          snapId={targetSubjectMetadata.origin}
          version={requestState.newVersion}
        />
        {!hasError && (
          <Text padding={[4, 4, 0, 4]} variant={TextVariant.headingLg}>
            {t('snapUpdate')}
          </Text>
        )}
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
              className="headers__permission-description"
              paddingLeft={4}
              paddingRight={4}
              paddingBottom={4}
              textAlign={TEXT_ALIGN.CENTER}
            >
              {t('snapUpdateRequestsPermission', [
                <b key="1">{originMetadata?.hostname}</b>,
                <b key="2">{snapName}</b>,
              ])}
            </Text>
            <UpdateSnapPermissionList
              approvedPermissions={approvedPermissions}
              revokedPermissions={revokedPermissions}
              newPermissions={newPermissions}
            />
          </>
        )}
        {isEmpty && (
          <Box
            flexDirection={FLEX_DIRECTION.COLUMN}
            height={BLOCK_SIZES.FULL}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <Text
              paddingLeft={4}
              paddingRight={4}
              textAlign={TEXT_ALIGN.CENTER}
            >
              {t('snapUpdateRequest', [
                <b key="1">{originMetadata?.hostname}</b>,
                <b key="2">{snapName}</b>,
              ])}
            </Text>
          </Box>
        )}
      </Box>
      <Box
        className="footers"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <PageContainerFooter
          cancelButtonType="default"
          hideCancel={hasError}
          disabled={isLoading}
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={handleSubmit}
          submitText={t(
            // eslint-disable-next-line no-nested-ternary
            hasError ? 'ok' : hasPermissions ? 'approveAndUpdate' : 'update',
          )}
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
  requestState: PropTypes.object.isRequired,
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
