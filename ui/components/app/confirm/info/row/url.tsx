import React, { useCallback, useState } from 'react';
import { isSnapId } from '@metamask/snaps-utils';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexWrap,
  IconColor,
  TextColor,
  TextVariant,
  BackgroundColor,
} from '../../../../../helpers/constants/design-system';
import SnapAuthorshipPill from '../../../snaps/snap-authorship-pill';
import { SnapMetadataModal } from '../../../snaps/snap-metadata-modal';
import { useOriginTrustSignals } from '../../../../../hooks/useOriginTrustSignals';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import Tooltip from '../../../../ui/tooltip';

export type ConfirmInfoRowUrlProps = {
  url: string;
};

const HttpWarning = () => (
  <Text
    variant={TextVariant.bodySm}
    display={Display.Flex}
    alignItems={AlignItems.center}
    borderRadius={BorderRadius.SM}
    backgroundColor={BackgroundColor.warningMuted}
    paddingLeft={1}
    paddingRight={1}
    color={TextColor.warningDefault}
  >
    <Icon
      name={IconName.Danger}
      color={IconColor.warningDefault}
      size={IconSize.Sm}
      marginInlineEnd={1}
    />
    HTTP
  </Text>
);

export const ConfirmInfoRowUrl = ({ url }: ConfirmInfoRowUrlProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handlePillClick = useCallback(
    () => setIsModalOpen(true),
    [setIsModalOpen],
  );
  const handleModalClose = useCallback(
    () => setIsModalOpen(false),
    [setIsModalOpen],
  );

  const originTrustSignals = useOriginTrustSignals(url);

  // Check if it's a Snap ID first to avoid unnecessary processing
  if (isSnapId(url)) {
    return (
      <>
        <SnapAuthorshipPill snapId={url} onClick={handlePillClick} />
        <SnapMetadataModal
          snapId={url}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </>
    );
  }

  let urlObject;
  try {
    urlObject = new URL(url);
  } catch (e) {
    console.log(`ConfirmInfoRowUrl: new URL(url) cannot parse ${url}`);
  }

  const isHTTP = urlObject?.protocol === 'http:';
  const urlWithoutProtocol = url?.replace(/https?:\/\//u, '');

  const renderIcon = () => {
    // Priority 1: Malicious
    if (originTrustSignals.state === TrustSignalDisplayState.Malicious) {
      return (
        <Icon
          name={IconName.Danger}
          color={IconColor.errorDefault}
          size={IconSize.Sm}
        />
      );
    }

    // Priority 2: HTTP Warning
    if (isHTTP) {
      return <HttpWarning />;
    }

    // Priority 3: Warning
    if (originTrustSignals.state === TrustSignalDisplayState.Warning) {
      return (
        <Icon
          name={IconName.Danger}
          color={IconColor.warningDefault}
          size={IconSize.Sm}
        />
      );
    }

    // Priority 4: Verified
    if (originTrustSignals.state === TrustSignalDisplayState.Verified) {
      return (
        <Tooltip title="Verified site" position="bottom">
          <Icon
            name={IconName.VerifiedFilled}
            color={IconColor.infoDefault}
            size={IconSize.Sm}
          />
        </Tooltip>
      );
    }

    // Priority 5: No icon (Unknown state)
    return null;
  };

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
    >
      {renderIcon()}
      <Text color={TextColor.inherit}>{urlWithoutProtocol}</Text>
    </Box>
  );
};
