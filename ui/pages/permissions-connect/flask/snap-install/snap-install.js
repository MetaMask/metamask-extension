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
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/flask/install-error/install-error';
import SnapAuthorship from '../../../../components/app/flask/snap-authorship';
import { Text } from '../../../../components/component-library';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import { getSnapName } from '../../../../helpers/utils/util';
import SnapPermissionsList from '../../../../components/app/flask/snap-permissions-list';

export default function SnapInstall({
  request,
  requestState,
  approveSnapInstall,
  rejectSnapInstall,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const [isShowingWarning, setIsShowingWarning] = useState(false);
  const originMetadata = useOriginMetadata(request.metadata?.dappOrigin) || {};

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
    requestState?.permissions &&
    Object.keys(requestState.permissions).length > 0;

  const isEmpty = !isLoading && !hasError && !hasPermissions;

  const warnings = getSnapInstallWarnings(
    requestState?.permissions ?? {},
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
        paddingLeft={4}
        paddingRight={4}
      >
        <SnapAuthorship snapId={targetSubjectMetadata.origin} />
        {!hasError && (
          <Text padding={[4, 4, 0, 4]} variant={TextVariant.headingLg}>
            {t('snapInstall')}
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
              paddingBottom={4}
              textAlign={TEXT_ALIGN.CENTER}
            >
              {t('snapInstallRequestsPermission', [
                <b key="1">{originMetadata?.hostname}</b>,
                <b key="2">{snapName}</b>,
              ])}
            </Text>
            <SnapPermissionsList
              permissions={requestState.permissions || {}}
              targetSubjectMetadata={targetSubjectMetadata}
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
            <Text textAlign={TEXT_ALIGN.CENTER}>
              {t('snapInstallRequest', [
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
