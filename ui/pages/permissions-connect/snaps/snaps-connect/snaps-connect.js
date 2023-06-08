import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/rpc-methods';
import { isObject } from '@metamask/utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../../components/ui/box';
import SiteOrigin from '../../../../components/ui/site-origin';
import {
  AvatarIcon,
  BadgeWrapper,
  BadgeWrapperPosition,
  IconName,
  IconSize,
  Text,
  ValidTag,
} from '../../../../components/component-library';
import {
  IconColor,
  FlexDirection,
  TextVariant,
  JustifyContent,
  AlignItems,
  TextAlign,
  Display,
  FontWeight,
  BlockSize,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import SnapConnectCell from '../../../../components/app/snaps/snap-connect-cell/snap-connect-cell';
import { getSnapName } from '../../../../helpers/utils/util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import SnapPrivacyWarning from '../../../../components/app/snaps/snap-privacy-warning/snap-privacy-warning';
import { getPermissions } from '../../../../selectors';

export default function SnapsConnect({
  request,
  approveConnection,
  rejectConnection,
  targetSubjectMetadata,
  snapsInstallPrivacyWarningShown,
  setSnapsInstallPrivacyWarningShownStatus,
}) {
  const t = useI18nContext();
  const { origin, iconUrl, name } = targetSubjectMetadata;
  const [isLoading, setIsLoading] = useState(false);
  const [isShowingSnapsPrivacyWarning, setIsShowingSnapsPrivacyWarning] =
    useState(!snapsInstallPrivacyWarningShown);
  const currentPermissions = useSelector((state) =>
    getPermissions(state, request?.metadata?.origin),
  );

  const onCancel = useCallback(() => {
    rejectConnection(request.metadata.id);
  }, [request, rejectConnection]);

  const onConnect = useCallback(() => {
    try {
      setIsLoading(true);
      approveConnection(request);
    } finally {
      setIsLoading(false);
    }
  }, [request, approveConnection]);

  const getSnaps = () => {
    const permission = request.permissions?.[WALLET_SNAP_PERMISSION_KEY];
    const requestedSnaps = permission?.caveats?.[0].value;
    const currentSnaps =
      currentPermissions?.[WALLET_SNAP_PERMISSION_KEY]?.caveats[0].value;

    if (!isObject(currentSnaps) && requestedSnaps) {
      return Object.keys(requestedSnaps);
    }

    const requestedSnapKeys = requestedSnaps ? Object.keys(requestedSnaps) : [];
    const currentSnapKeys = currentSnaps ? Object.keys(currentSnaps) : [];
    const dedupedSnaps = requestedSnapKeys.filter(
      (snapId) => !currentSnapKeys.includes(snapId),
    );

    return dedupedSnaps.length ? dedupedSnaps : requestedSnapKeys;
  };

  const snaps = getSnaps();

  const ConnectIcon = () => {
    return (
      <BadgeWrapper
        badge={
          <AvatarIcon
            iconName={IconName.Question}
            size={IconSize.Xs}
            backgroundColor={BackgroundColor.backgroundAlternative}
            borderColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
            iconProps={{
              size: IconSize.Md,
              color: IconColor.iconDefault,
            }}
          />
        }
        position={BadgeWrapperPosition.bottomRight}
      >
        <AvatarIcon
          iconName={IconName.Snaps}
          size={IconSize.Xl}
          backgroundColor={IconColor.infoDefault}
          iconProps={{
            size: IconSize.Xl,
            color: IconColor.infoInverse,
          }}
        />
      </BadgeWrapper>
    );
  };

  const trimUrl = (url) => {
    const regex = /^(https:\/\/|http:\/\/)/u;
    return url.replace(regex, '');
  };

  const SnapsConnectContent = () => {
    const trimmedOrigin = trimUrl(origin);
    if (isLoading) {
      return (
        <Box
          className="snap-connect__loader-container"
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          <PulseLoader />
        </Box>
      );
    }
    if (snaps?.length > 1) {
      return (
        <Box
          className="snaps-connect__content"
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={8}
          width={BlockSize.Full}
          style={{ overflowY: 'hidden' }}
        >
          <Text paddingBottom={2} variant={TextVariant.headingLg}>
            {t('connectionRequest')}
          </Text>
          <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
            {t('multipleSnapConnectionWarning', [
              <Text
                as={ValidTag.Span}
                key="1"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {trimmedOrigin}
              </Text>,
              <Text
                as={ValidTag.Span}
                key="2"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {snaps?.length}
              </Text>,
            ])}
          </Text>
          <Box
            className="snaps-connect__content__snaps-list"
            flexDirection={FlexDirection.Column}
            display={Display.Flex}
            marginTop={4}
            width={BlockSize.Full}
            style={{ overflowY: 'auto', flex: 1 }}
          >
            {snaps.map((snap) => (
              // TODO(hbmalik88): add in the iconUrl prop when we have access to a snap's icons pre-installation
              <SnapConnectCell
                key={`snaps-connect-${snap}`}
                snapId={snap}
                origin={trimmedOrigin}
              />
            ))}
          </Box>
        </Box>
      );
    } else if (snaps?.length === 1) {
      return (
        <Box
          className="snaps-connect__content"
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          height={BlockSize.Full}
          paddingLeft={4}
          paddingRight={4}
        >
          <Box paddingBottom={2}>
            <ConnectIcon />
          </Box>
          <Text paddingBottom={2} variant={TextVariant.headingLg}>
            {t('connectionRequest')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            padding={[0, 4]}
          >
            {t('snapConnectionWarning', [
              <Text
                as={ValidTag.Span}
                key="1"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {trimmedOrigin}
              </Text>,
              <Text
                as={ValidTag.Span}
                key="2"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {getSnapName(snaps?.[0])}
              </Text>,
            ])}
          </Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box
      className="page-container snaps-connect"
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
    >
      {isShowingSnapsPrivacyWarning && (
        <SnapPrivacyWarning
          onAccepted={() => {
            setIsShowingSnapsPrivacyWarning(false);
            setSnapsInstallPrivacyWarningShownStatus(true);
          }}
          onCanceled={onCancel}
        />
      )}
      <Box
        className="snaps-connect__header"
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        paddingLeft={4}
        paddingRight={4}
      >
        <SiteOrigin
          chip
          siteOrigin={origin}
          title={origin}
          iconSrc={iconUrl}
          name={name}
        />
      </Box>
      <SnapsConnectContent />
      <PageContainerFooter
        footerClassName="snaps-connect__footer"
        cancelButtonType="default"
        hideCancel={false}
        disabled={isLoading}
        onCancel={onCancel}
        cancelText={t('cancel')}
        onSubmit={onConnect}
        submitText={t('connect')}
      />
    </Box>
  );
}

SnapsConnect.propTypes = {
  request: PropTypes.object.isRequired,
  approveConnection: PropTypes.func.isRequired,
  rejectConnection: PropTypes.func.isRequired,
  targetSubjectMetadata: PropTypes.shape({
    extensionId: PropTypes.string,
    iconUrl: PropTypes.string,
    name: PropTypes.string,
    origin: PropTypes.string,
    subjectType: PropTypes.string,
  }),
  snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
  setSnapsInstallPrivacyWarningShownStatus: PropTypes.func,
};
