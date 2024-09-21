import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box, IconSize, Text } from '../../../../components/component-library';
import {
  FlexDirection,
  TextVariant,
  JustifyContent,
  AlignItems,
  TextAlign,
  Display,
  FontWeight,
  BlockSize,
  OverflowWrap,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import SnapConnectCell from '../../../../components/app/snaps/snap-connect-cell/snap-connect-cell';
import { getDedupedSnaps } from '../../../../helpers/utils/util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import SnapPrivacyWarning from '../../../../components/app/snaps/snap-privacy-warning/snap-privacy-warning';
import { getPermissions, getSnapMetadata } from '../../../../selectors';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
import { isSnapId } from '../../../../helpers/utils/snaps';
import { SnapIcon } from '../../../../components/app/snaps/snap-icon';

export default function SnapsConnect({
  request,
  approveConnection,
  rejectConnection,
  targetSubjectMetadata,
  snapsInstallPrivacyWarningShown,
  setSnapsInstallPrivacyWarningShownStatus,
}) {
  const t = useI18nContext();
  const { origin } = targetSubjectMetadata;
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

  const snaps = getDedupedSnaps(request, currentPermissions);

  const SnapsConnectContent = () => {
    let trimmedOrigin = (useOriginMetadata(origin) || {})?.hostname;
    const { name } = useSelector((state) =>
      // hack around the selector throwing
      getSnapMetadata(state, isSnapId(origin) ? origin : `npm:${origin}`),
    );

    if (isSnapId(origin)) {
      trimmedOrigin = name;
    }

    const snapId = snaps[0];
    const { name: snapName } = useSelector((state) =>
      getSnapMetadata(state, snapId),
    );

    if (isLoading) {
      return (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          width={BlockSize.Full}
          height={BlockSize.Full}
        >
          <PulseLoader />
        </Box>
      );
    }

    if (snaps?.length > 1) {
      return (
        <Box
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          paddingTop={4}
          width={BlockSize.Full}
          style={{ overflowY: 'hidden' }}
          backgroundColor={BackgroundColor.backgroundAlternative}
        >
          <Text
            paddingBottom={2}
            variant={TextVariant.headingMd}
            textAlign={TextAlign.Center}
          >
            {t('connectionRequest')}
          </Text>
          <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
            {t('multipleSnapConnectionWarning', [
              <Text
                as="span"
                key="1"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {trimmedOrigin}
              </Text>,
              <Text
                as="span"
                key="2"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {snaps?.length}
              </Text>,
            ])}
          </Text>
          <Box
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
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          width={BlockSize.Full}
          height={BlockSize.Full}
          paddingLeft={4}
          paddingRight={4}
          backgroundColor={BackgroundColor.backgroundAlternative}
        >
          <Box paddingBottom={2}>
            <SnapIcon snapId={snaps[0]} avatarSize={IconSize.Xl} />
          </Box>
          <Text paddingBottom={2} variant={TextVariant.headingMd}>
            {t('connectionRequest')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            padding={[0, 4]}
            overflowWrap={OverflowWrap.Anywhere}
          >
            {t('snapConnectionWarning', [
              <Text
                as="span"
                key="1"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {trimmedOrigin}
              </Text>,
              <Text
                as="span"
                key="2"
                variant={TextVariant.bodyMd}
                fontWeight={FontWeight.Medium}
              >
                {snapName}
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
      className="snaps-connect"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundAlternative}
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
        display={Display.Flex}
        height={BlockSize.Full}
        width={BlockSize.Full}
        paddingLeft={4}
        paddingRight={4}
      >
        <SnapsConnectContent />
      </Box>
      <PageContainerFooter
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
