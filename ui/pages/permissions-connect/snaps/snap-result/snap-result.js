import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Box from '../../../../components/ui/box/box';
import {
  AlignItems,
  BlockSize,
  BorderStyle,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextVariant,
  BackgroundColor,
  IconColor,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  IconName,
  Text,
} from '../../../../components/component-library';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import InstallError from '../../../../components/app/snaps/install-error/install-error';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import { getSnapMetadata } from '../../../../selectors';

export default function SnapResult({
  request,
  requestState,
  approveSnapResult,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();

  const onSubmit = useCallback(
    () => approveSnapResult(request.metadata.id),
    [request, approveSnapResult],
  );

  const hasError = !requestState.loading && requestState.error;
  const isLoading = requestState.loading;
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, targetSubjectMetadata.origin),
  );

  function getSuccessScreen(requestType, snapNameToRender) {
    let successScreenTitle;
    switch (requestType) {
      case 'wallet_installSnap':
        successScreenTitle = t('snapInstallSuccess');
        break;
      case 'wallet_updateSnap':
        successScreenTitle = t('snapUpdateSuccess');
        break;
      default:
        successScreenTitle = t('snapResultSuccess');
    }

    return (
      <Box
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        height={BlockSize.Full}
        paddingTop={2}
        paddingBottom={2}
      >
        <AvatarIcon
          className="snap-result__header__icon"
          iconName={IconName.Confirmation}
          size={AvatarIconSize.Xl}
          color={IconColor.successDefault}
          backgroundColor={BackgroundColor.successMuted}
        />
        <Text
          fontWeight={FontWeight.Bold}
          variant={TextVariant.headingLg}
          paddingBottom={2}
          marginTop={4}
        >
          {successScreenTitle}
        </Text>
        <Text textAlign={TextAlign.Center}>
          {t('snapResultSuccessDescription', [
            <Text as="span" key="1" fontWeight={FontWeight.Medium}>
              {snapNameToRender}
            </Text>,
          ])}
        </Text>
      </Box>
    );
  }

  function getFailedScreen(requestType, snapNameToRender) {
    let failedScreenTitle;
    let failedScreenDescription;

    switch (requestType) {
      case 'wallet_installSnap':
        failedScreenTitle = t('snapInstallationErrorTitle');
        failedScreenDescription = t('snapInstallationErrorDescription', [
          <Text as="span" key="1" fontWeight={FontWeight.Medium}>
            {snapNameToRender}
          </Text>,
        ]);
        break;
      case 'wallet_updateSnap':
        failedScreenTitle = t('snapUpdateErrorTitle');
        failedScreenDescription = t('snapUpdateErrorDescription', [
          <Text as="span" key="1" fontWeight={FontWeight.Medium}>
            {snapNameToRender}
          </Text>,
        ]);
        break;
      default:
        failedScreenTitle = t('snapResultError');
    }

    return (
      <InstallError
        error={requestState.error}
        title={failedScreenTitle}
        description={failedScreenDescription}
        iconName={IconName.Warning}
      />
    );
  }

  return (
    <Box
      className="page-container snap-result"
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
    >
      <SnapAuthorshipHeader snapId={targetSubjectMetadata.origin} />
      <Box
        className="snap-result__content"
        paddingLeft={4}
        paddingRight={4}
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
        style={{
          overflowY: 'auto',
        }}
      >
        {isLoading && (
          <Box
            className="snap-result__content__loader-container"
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <PulseLoader />
          </Box>
        )}
        {!isLoading &&
          !hasError &&
          getSuccessScreen(requestState.type, snapName)}
        {hasError && getFailedScreen(requestState.type, snapName)}
      </Box>
      <Box
        className="snap-result__footer"
        alignItems={AlignItems.center}
        flexDirection={FlexDirection.Column}
        style={{
          boxShadow: 'var(--shadow-size-lg) var(--color-shadow-default)',
        }}
      >
        <PageContainerFooter
          hideCancel
          disabled={isLoading}
          onSubmit={onSubmit}
          submitText={t('ok').toUpperCase()}
        />
      </Box>
    </Box>
  );
}

SnapResult.propTypes = {
  request: PropTypes.object.isRequired,
  requestState: PropTypes.object.isRequired,
  approveSnapResult: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string.isRequired,
    sourceCode: PropTypes.string,
    version: PropTypes.string,
  }).isRequired,
};
