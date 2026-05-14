import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { isSnapId } from '@metamask/snaps-utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { IconSize, Text } from '../../../../components/component-library';
import {
  TextVariant,
  TextAlign,
  FontWeight,
  OverflowWrap,
} from '../../../../helpers/constants/design-system';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import SnapConnectCell from '../../../../components/app/snaps/snap-connect-cell/snap-connect-cell';
import { getDedupedSnaps } from '../../../../helpers/utils/util';
import PulseLoader from '../../../../components/ui/pulse-loader/pulse-loader';
import SnapPrivacyWarning from '../../../../components/app/snaps/snap-privacy-warning/snap-privacy-warning';
import {
  getPermissions,
  getPreinstalledSnaps,
  getSnapMetadata,
} from '../../../../selectors';
import { useOriginMetadata } from '../../../../hooks/useOriginMetadata';
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

  const currentPermissions = useSelector((state) =>
    getPermissions(state, request?.metadata?.origin),
  );

  const preinstalledSnaps = useSelector(getPreinstalledSnaps);

  const snaps = getDedupedSnaps(request, currentPermissions);
  const snapId = snaps[0];
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const isPreinstalled = Object.keys(preinstalledSnaps).includes(snapId);
  const [isShowingSnapsPrivacyWarning, setIsShowingSnapsPrivacyWarning] =
    useState(!isPreinstalled && !snapsInstallPrivacyWarningShown);

  const onCancel = useCallback(() => {
    rejectConnection(request?.metadata?.id);
  }, [request, rejectConnection]);

  const onConnect = useCallback(() => {
    try {
      setIsLoading(true);
      approveConnection(request);
    } finally {
      setIsLoading(false);
    }
  }, [request, approveConnection]);

  const SnapsConnectContent = () => {
    let trimmedOrigin = (useOriginMetadata(origin) || {})?.hostname;
    const { name } = useSelector((state) =>
      // hack around the selector throwing
      getSnapMetadata(state, isSnapId(origin) ? origin : `npm:${origin}`),
    );

    if (isSnapId(origin)) {
      trimmedOrigin = name;
    }

    if (isLoading) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="h-full w-full"
        >
          <PulseLoader />
        </Box>
      );
    }

    if (snaps?.length > 1) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          paddingTop={4}
          className="w-full"
          style={{ overflowY: 'hidden' }}
          backgroundColor={BoxBackgroundColor.BackgroundAlternative}
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
            flexDirection={BoxFlexDirection.Column}
            marginTop={4}
            className="w-full"
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
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          paddingLeft={4}
          paddingRight={4}
          className="h-full w-full"
          backgroundColor={BoxBackgroundColor.BackgroundAlternative}
        >
          <Box paddingBottom={2}>
            <SnapIcon snapId={snaps[0]} avatarSize={IconSize.Xl} />
          </Box>
          <Text
            paddingBottom={2}
            variant={TextVariant.headingMd}
            textAlign="center"
          >
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
      className="snaps-connect h-full w-full"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      backgroundColor={BoxBackgroundColor.BackgroundAlternative}
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
        flexDirection={BoxFlexDirection.Row}
        paddingLeft={4}
        paddingRight={4}
        className="h-full w-full"
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
