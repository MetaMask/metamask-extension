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
  IconColor,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { getSnapMetadata } from '../../../../selectors';

import {
  Text,
  Box,
  AvatarIcon,
  IconName,
  IconSize,
  ButtonIconSize,
  ButtonIcon,
} from '../../../component-library';
import SnapAvatar from '../snap-avatar';
import { SnapMetadataModal } from '../snap-metadata-modal';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const SnapAuthorshipHeader = ({
  snapId,
  className,
  boxShadow = 'var(--shadow-size-md) var(--color-shadow-default)',
  showInfo = true,
  startAccessory,
  endAccessory,
  onCancel,
}) => {
  const t = useI18nContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // We're using optional chaining with snapId, because with the current implementation
  // of snap update in the snap controller, we do not have reference to snapId when an
  // update request is rejected because the reference comes from the request itself and not subject metadata
  // like it is done with snap install
  const packageName = snapId && stripSnapPrefix(snapId);

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => setIsModalOpen(false);

  return (
    <Box
      className={classnames('snaps-authorship-header', className)}
      backgroundColor={BackgroundColor.backgroundAlternative}
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
      {onCancel && (
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          size={ButtonIconSize.Md}
          onClick={onCancel}
          color={IconColor.iconDefault}
        />
      )}
      {startAccessory && startAccessory}
      <Box
        marginLeft={4}
        marginRight={4}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ overflow: 'hidden' }}
        width={BlockSize.Full}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <SnapAvatar
            snapId={snapId}
            avatarSize={IconSize.Sm}
            badgeSize={IconSize.Xs}
          />
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
            marginLeft={2}
            ellipsis
          >
            {snapName}
          </Text>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          paddingTop={1}
        >
          <Text
            ellipsis
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
          >
            {packageName}
          </Text>
        </Box>
      </Box>
      {showInfo && (
        <Box marginLeft="auto">
          <AvatarIcon
            className="snaps-authorship-header__button"
            iconName={IconName.Info}
            onClick={openModal}
            color={IconColor.iconDefault}
            backgroundColor={BackgroundColor.backgroundAlternative}
          />
        </Box>
      )}
      {endAccessory && endAccessory}
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
  showInfo: PropTypes.bool,
  startAccessory: PropTypes.element,
  endAccessory: PropTypes.element,
  onCancel: PropTypes.func,
};

export default SnapAuthorshipHeader;
