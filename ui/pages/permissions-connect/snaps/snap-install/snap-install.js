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
  JustifyContent,
  TextVariant,
  TEXT_ALIGN,
  FontWeight,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import {
  AvatarIcon,
  IconName,
  ValidTag,
  Text,
} from '../../../../components/component-library';
import { getSnapName } from '../../../../helpers/utils/util';
import SnapPermissionsList from '../../../../components/app/snaps/snap-permissions-list';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';
import SiteOrigin from '../../../../components/ui/site-origin/site-origin';
import InstallError from '../../../../components/app/snaps/install-error/install-error';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';

export default function SnapInstall({
  request,
  requestState,
  approveSnapInstall,
  rejectSnapInstall,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();
  const siteMetadata = useOriginMetadata(request?.metadata?.dappOrigin) || {};
  const { origin, iconUrl, name } = siteMetadata;
  const [isShowingWarning, setIsShowingWarning] = useState(false);

  const { isScrollable, isScrolledToBottom, scrollToBottom, ref, onScroll } =
    useScrollRequired([requestState]);

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

  const warnings = getSnapInstallWarnings(
    requestState?.permissions ?? {},
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

  const getFooterMessage = () => {
    if (hasError) {
      return 'ok';
    } else if (isLoading) {
      return 'connect';
    }
    return 'install';
  };

  return (
    <Box
      className="page-container snap-install"
      justifyContent={JustifyContent.spaceBetween}
      height={BLOCK_SIZES.FULL}
      borderStyle={BorderStyle.none}
      flexDirection={FLEX_DIRECTION.COLUMN}
    >
      {isLoading || hasError ? (
        <Box
          width="full"
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          paddingTop={4}
        >
          <SiteOrigin
            chip
            siteOrigin={origin}
            title={origin}
            iconSrc={iconUrl}
            iconName={name}
          />
        </Box>
      ) : (
        <SnapAuthorshipHeader snapId={targetSubjectMetadata.origin} />
      )}
      <Box
        ref={!isLoading && !hasError ? ref : undefined}
        onScroll={onScroll}
        className="snap-install__content"
        style={{
          overflowY: 'auto',
          flex: !isLoading && !hasError && '1',
        }}
      >
        {isLoading && (
          <Box
            className="snap-install__content__loader-container"
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
            title={t('connectionFailed')}
            description={t('connectionFailedDescription', [
              <Text as={ValidTag.Span} key="1" fontWeight={FontWeight.Medium}>
                {snapName}
              </Text>,
            ])}
            error={requestState.error}
          />
        )}
        {!hasError && !isLoading && (
          <>
            <Text
              variant={TextVariant.headingLg}
              paddingTop={4}
              paddingBottom={2}
              textAlign="center"
            >
              {t('installRequest')}
            </Text>
            <Text
              className="snap-install__content__permission-description"
              paddingBottom={4}
              paddingLeft={4}
              paddingRight={4}
              textAlign={TEXT_ALIGN.CENTER}
            >
              {t('snapInstallRequest', [
                <Text
                  as={ValidTag.Span}
                  key="2"
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {snapName}
                </Text>,
              ])}
            </Text>
            <SnapPermissionsList
              snapId={targetSubjectMetadata.origin}
              permissions={requestState.permissions || {}}
              targetSubjectMetadata={targetSubjectMetadata}
            />
            {isScrollable && !isScrolledToBottom ? (
              <AvatarIcon
                className="snap-install__scroll-button"
                data-testid="snap-install-scroll"
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
        className="snap-install__footer"
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
          submitText={t(getFooterMessage())}
        />
      </Box>
      {isShowingWarning && (
        <SnapInstallWarning
          onCancel={() => setIsShowingWarning(false)}
          onSubmit={onSubmit}
          warnings={warnings}
          snapName={snapName}
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
