import React from 'react';
import PropTypes from 'prop-types';
import {
  BackgroundColor,
  Display,
  FlexDirection,
  IconColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';

export const SelectActionModal = ({ onClick, showIcon }) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen
      onClose={() => {
        console.log('close');
      }}
      className="select-action-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => {
            console.log('close');
          }}
        >
          {t('selectAnAction')}
        </ModalHeader>
        <Box marginTop={6}>
          <Box
            paddingTop={4}
            paddingBottom={4}
            gap={4}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            onClick={onClick}
          >
            <Box>
              <AvatarIcon
                iconName={IconName.Export}
                color={IconColor.primaryInverse}
                backgroundColor={BackgroundColor.primaryDefault}
                size={AvatarIconSize.Md}
              />
            </Box>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              <Box display={Display.Flex} flexDirection={FlexDirection.Row}>
                <Text variant={TextVariant.bodyLgMedium}>Hi</Text>
                {showIcon && (
                  <Icon
                    name={IconName.Export}
                    size={IconSize.Xs}
                    color={IconColor.iconAlternative}
                  />
                )}
              </Box>
              <Text variant={TextVariant.bodyMd}>Ho</Text>
            </Box>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};

SelectActionModal.propTypes = {
  /**
   * Show link icon with text
   */
  showIcon: PropTypes.bool,
  /**
   * onClick handler for each action
   */
  onClick: PropTypes.func,
};
