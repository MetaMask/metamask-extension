import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  TextColor,
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
import { SnapMetadataModal } from '../snap-metadata-modal';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { SnapIcon } from '../snap-icon';

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
        minHeight: '64px',
        zIndex: 1,
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
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        style={{ overflow: 'hidden' }}
        width={BlockSize.Full}
      >
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <SnapIcon snapId={snapId} avatarSize={IconSize.Sm} />
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.bodyMdMedium}
            marginLeft={2}
            ellipsis
          >
            {snapName}
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
