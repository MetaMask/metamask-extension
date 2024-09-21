import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SnapInstallWarning from '../../../../components/app/snaps/snap-install-warning';
import {
  AlignItems,
  BackgroundColor,
  BorderStyle,
  FontWeight,
  JustifyContent,
  TextVariant,
  IconColor,
  Display,
  BorderRadius,
  BlockSize,
  FlexDirection,
  TextAlign,
} from '../../../../helpers/constants/design-system';

import UpdateSnapPermissionList from '../../../../components/app/snaps/update-snap-permission-list';
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/snaps/install-error/install-error';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import {
  AvatarIcon,
  Box,
  IconName,
  Text,
} from '../../../../components/component-library';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';
import { getSnapMetadata, getSnapsMetadata } from '../../../../selectors';
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

  const [showAllPermissions, setShowAllPermissions] = useState(false);

  const { isScrollable, hasScrolledToBottom, scrollToBottom, ref, onScroll } =
    useScrollRequired([requestState]);
  const snapsMetadata = useSelector(getSnapsMetadata);

  const onCancel = useCallback(
    () => rejectSnapUpdate(request.metadata.id),
    [request, rejectSnapUpdate],
  );

  const onSubmit = useCallback(
    () => approveSnapUpdate(request.metadata.id),
    [request, approveSnapUpdate],
  );

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, targetSubjectMetadata.origin),
  );

  const approvedPermissions = requestState.approvedPermissions ?? {};
  const revokedPermissions = requestState.unusedPermissions ?? {};
  const newPermissions = requestState.newPermissions ?? {};
  const approvedConnections = requestState.approvedConnections ?? {};
  const revokedConnections = requestState.unusedConnections ?? {};
  const newConnections = requestState.newConnections ?? {};
  const { newVersion } = requestState;

  const isLoading = requestState.loading;
  const hasError = !isLoading && requestState.error;

  const warnings = getSnapInstallWarnings(
    newPermissions,
    t,
    snapName,
    getSnapName(snapsMetadata),
  );

  const shouldShowWarning = warnings.length > 0;

  const handleSubmit = () => {
    if (!hasError && shouldShowWarning) {
      setIsShowingWarning(true);
    } else if (hasError) {
      onCancel();
    } else {
      onSubmit();
    }
  };

  const onShowAllPermissions = () => {
    setShowAllPermissions(true);
  };

  return (
    <Box
      className="snap-update"
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <SnapAuthorshipHeader
        snapId={targetSubjectMetadata.origin}
        onCancel={onCancel}
      />
      <Box
        ref={ref}
        onScroll={onScroll}
        className="snap-update__content"
        style={{
          overflowY: 'auto',
          flex: !isLoading && '1',
        }}
        paddingLeft={4}
        paddingRight={4}
      >
        {!isLoading && !hasError && (
          <Text
            paddingTop={4}
            paddingBottom={2}
            variant={TextVariant.headingMd}
            textAlign="center"
          >
            {t('updateRequest')}
          </Text>
        )}
        {isLoading && (
          <Box
            className="snap-update__content__loader-container"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <PulseLoader />
          </Box>
        )}
        {hasError && (
          <InstallError
            iconName={IconName.Warning}
            error={requestState.error}
            title={t('snapUpdateErrorTitle')}
            description={t('snapUpdateErrorDescription', [
              <Text as="span" key="1" fontWeight={FontWeight.Medium}>
                {snapName}
              </Text>,
            ])}
          />
        )}
        {!hasError && !isLoading && (
          <>
            <Text
              className="snap-update__content__permission-description"
              paddingBottom={4}
              paddingLeft={4}
              paddingRight={4}
              textAlign={TextAlign.Center}
            >
              {t('snapUpdateRequest', [
                <Text
                  as="span"
                  key="2"
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {snapName}
                </Text>,
                <Text
                  as="span"
                  key="3"
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {newVersion}
                </Text>,
              ])}
            </Text>
            <Box
              display={Display.Flex}
              backgroundColor={BackgroundColor.backgroundDefault}
              paddingLeft={4}
              paddingRight={4}
              paddingTop={2}
              paddingBottom={2}
              borderRadius={BorderRadius.XL}
            >
              <UpdateSnapPermissionList
                approvedPermissions={approvedPermissions}
                revokedPermissions={revokedPermissions}
                newPermissions={newPermissions}
                approvedConnections={approvedConnections}
                revokedConnections={revokedConnections}
                newConnections={newConnections}
                targetSubjectMetadata={targetSubjectMetadata}
                showAllPermissions={onShowAllPermissions}
              />
            </Box>
            <Box className="snap-update__scroll-button-area">
              {isScrollable && !hasScrolledToBottom && !showAllPermissions ? (
                <AvatarIcon
                  className="snap-install__scroll-button"
                  data-testid="snap-update-scroll"
                  iconName={IconName.Arrow2Down}
                  backgroundColor={BackgroundColor.infoDefault}
                  color={IconColor.primaryInverse}
                  onClick={scrollToBottom}
                  style={{ cursor: 'pointer' }}
                />
              ) : null}
            </Box>
          </>
        )}
      </Box>
      <Box
        className="snap-update__footer"
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        <PageContainerFooter
          cancelButtonType="default"
          hideCancel={hasError}
          disabled={
            isLoading || (!hasError && isScrollable && !hasScrolledToBottom)
          }
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={handleSubmit}
          submitText={t(hasError ? 'ok' : 'confirm')}
        />
      </Box>
      {isShowingWarning && (
        <SnapInstallWarning
          onCancel={() => setIsShowingWarning(false)}
          onSubmit={onSubmit}
          snapName={snapName}
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
