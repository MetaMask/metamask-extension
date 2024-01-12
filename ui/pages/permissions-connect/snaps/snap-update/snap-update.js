import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SnapInstallWarning from '../../../../components/app/snaps/snap-install-warning';
import Box from '../../../../components/ui/box/box';
import {
  AlignItems,
  BackgroundColor,
  BLOCK_SIZES,
  BorderStyle,
  FLEX_DIRECTION,
  FontWeight,
  JustifyContent,
  TextVariant,
  TEXT_ALIGN,
  IconColor,
} from '../../../../helpers/constants/design-system';

import UpdateSnapPermissionList from '../../../../components/app/snaps/update-snap-permission-list';
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/snaps/install-error/install-error';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import {
  AvatarIcon,
  IconName,
  ValidTag,
  Text,
} from '../../../../components/component-library';
import { getSnapName } from '../../../../helpers/utils/util';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';

export default function SnapUpdate({
  request,
  requestState,
  approveSnapUpdate,
  rejectSnapUpdate,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const [isShowingWarning, setIsShowingWarning] = useState(false);

  const { isScrollable, isScrolledToBottom, scrollToBottom, ref, onScroll } =
    useScrollRequired([requestState]);

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
  const { newVersion } = requestState;

  const isLoading = requestState.loading;
  const hasError = !isLoading && requestState.error;

  const warnings = getSnapInstallWarnings(
    newPermissions,
    targetSubjectMetadata,
    t,
  );

  const shouldShowWarning = warnings.length > 0;

  const snapName = getSnapName(
    targetSubjectMetadata.origin,
    targetSubjectMetadata,
  );

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
      <SnapAuthorshipHeader snapId={targetSubjectMetadata.origin} />
      <Box
        ref={ref}
        onScroll={onScroll}
        className="snap-update__content"
        style={{
          overflowY: 'auto',
          flex: !isLoading && '1',
        }}
      >
        {!isLoading && !hasError && (
          <Text
            paddingBottom={4}
            paddingTop={4}
            variant={TextVariant.headingLg}
            textAlign="center"
          >
            {t('updateRequest')}
          </Text>
        )}
        {isLoading && (
          <Box
            className="snap-update__content__loader-container"
            flexDirection={FLEX_DIRECTION.COLUMN}
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
              <Text as={ValidTag.Span} key="1" fontWeight={FontWeight.Medium}>
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
              textAlign={TEXT_ALIGN.CENTER}
            >
              {t('snapUpdateRequest', [
                <Text
                  as={ValidTag.Span}
                  key="2"
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {snapName}
                </Text>,
                <Text
                  as={ValidTag.Span}
                  key="3"
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {newVersion}
                </Text>,
              ])}
            </Text>
            <UpdateSnapPermissionList
              approvedPermissions={approvedPermissions}
              revokedPermissions={revokedPermissions}
              newPermissions={newPermissions}
              targetSubjectMetadata={targetSubjectMetadata}
            />
            {isScrollable && !isScrolledToBottom ? (
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
          </>
        )}
      </Box>
      <Box
        className="snap-update__footer"
        alignItems={AlignItems.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
        style={{
          boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
        }}
      >
        <PageContainerFooter
          cancelButtonType="default"
          hideCancel={hasError}
          disabled={
            isLoading || (!hasError && isScrollable && !isScrolledToBottom)
          }
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={handleSubmit}
          submitText={t(hasError ? 'ok' : 'update')}
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
