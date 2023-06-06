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
} from '../../../../helpers/constants/design-system';
import { getSnapInstallWarnings } from '../util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/snaps/install-error/install-error';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import {
  AvatarIcon,
  IconName,
  Text,
  ValidTag,
} from '../../../../components/component-library';
import { getSnapName } from '../../../../helpers/utils/util';
import SnapPermissionsList from '../../../../components/app/snaps/snap-permissions-list';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';

export default function SnapInstall({
  request,
  requestState,
  approveSnapInstall,
  rejectSnapInstall,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

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
      <SnapAuthorshipHeader snapId={targetSubjectMetadata.origin} />
      <Box
        ref={ref}
        onScroll={onScroll}
        className="snap-install__content"
        style={{
          overflowY: 'auto',
          flex: !isLoading && '1',
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
          <InstallError error={requestState.error} title={t('requestFailed')} />
        )}
        {!hasError && !isLoading && (
          <>
            <Text
              variant={TextVariant.headingLg}
              paddingTop={4}
              paddingBottom={2}
              textAlign="center"
            >
              {t('snapInstall')}
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
              permissions={requestState.permissions || {}}
              targetSubjectMetadata={targetSubjectMetadata}
            />
            {isScrollable && !isScrolledToBottom ? (
              <AvatarIcon
                className="snap-install__scroll-button"
                data-testid="snap-install-scroll"
                iconName={IconName.Arrow2Down}
                backgroundColor={BackgroundColor.infoDefault}
                color={BackgroundColor.backgroundDefault}
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
          submitText={t(hasError ? 'ok' : 'install')}
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
