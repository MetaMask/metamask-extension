import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { stripSnapPrefix } from '@metamask/snaps-utils';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  TextColor,
  FlexDirection,
  TextVariant,
  AlignItems,
  Display,
  BlockSize,
  FontWeight,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { getSnapMetadata } from '../../../../selectors';

import { Text, Box, AvatarIcon, IconName } from '../../../component-library';
import SnapAvatar from '../snap-avatar';
import { SnapMetadataModal } from '../snap-metadata-modal';

const SnapAuthorshipHeader = ({
  snapId,
  className,
  boxShadow = 'var(--shadow-size-lg) var(--color-shadow-default)',
  website,
  websiteName,
  websiteOrigin,
  websiteIconUrl,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const packageName = snapId ? stripSnapPrefix(snapId) : websiteOrigin;

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => setIsModalOpen(false);

  return (
    <Box
      className={classnames('snaps-authorship-header', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      alignItems={AlignItems.center}
      display={Display.Flex}
      padding={4}
      style={{
        boxShadow,
      }}
    >
      {snapId && (
        <SnapMetadataModal
          snapId={snapId}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
      <Box>
        <SnapAvatar snapId={snapId} websiteIconUrl={websiteIconUrl} />
      </Box>
      <Box
        marginLeft={4}
        marginRight={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ overflow: 'hidden' }}
      >
        <Text ellipsis fontWeight={FontWeight.Medium}>
          {snapName || websiteName}
        </Text>
        <Text
          ellipsis
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
        >
          {packageName}
        </Text>
      </Box>
      {!website && (
        <Box marginLeft="auto">
          <AvatarIcon
            className="snaps-authorship-header__button"
            iconName={IconName.Info}
            onClick={openModal}
            color={IconColor.iconMuted}
            backgroundColor={BackgroundColor.backgroundAlternative}
          />
        </Box>
      )}
    </Box>
  );
};

SnapAuthorshipHeader.propTypes = {
  /**
   * The id of the snap
   */
  snapId: PropTypes.string,
  /**
   * The className of the SnapAuthorship
   */
  className: PropTypes.string,
  boxShadow: PropTypes.string,
  website: PropTypes.bool,
  websiteName: PropTypes.string,
  websiteOrigin: PropTypes.string,
  websiteIconUrl: PropTypes.string,
};

export default SnapAuthorshipHeader;
