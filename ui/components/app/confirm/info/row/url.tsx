import React, { useCallback, useState } from 'react';
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
import { isSnapId } from '../../../../../helpers/utils/snaps';

export type ConfirmInfoRowUrlProps = {
  url: string;
};

export const ConfirmInfoRowUrl = ({ url }: ConfirmInfoRowUrlProps) => {
  let urlObject;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handlePillClick = useCallback(
    () => setIsModalOpen(true),
    [setIsModalOpen],
  );
  const handleModalClose = useCallback(
    () => setIsModalOpen(false),
    [setIsModalOpen],
  );

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

  try {
    urlObject = new URL(url);
  } catch (e) {
    console.log(`ConfirmInfoRowUrl: new URL(url) cannot parse ${url}`);
  }

  const isHTTP = urlObject?.protocol === 'http:';

  const urlWithoutProtocol = url?.replace(/https?:\/\//u, '');

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
    >
      {isHTTP && (
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
      )}
      <Text color={TextColor.inherit}>{urlWithoutProtocol}</Text>
    </Box>
  );
};
