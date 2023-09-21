import React from 'react';
import {
  FlexDirection,
  AlignItems,
  Display,
  JustifyContent,
  IconColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const KeyringSnapRemovalResult = ({
  snapName,
  result,
  isOpen,
  onClose,
}: {
  snapName: string;
  result: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  return (
    <>
      <Modal isOpen={isOpen} onClose={() => onClose()}>
        <ModalOverlay />
        <ModalContent
          modalDialogProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            gap: 4,
          }}
        >
          <ModalHeader onClose={onClose}>{''}</ModalHeader>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
          >
            <Icon
              name={
                result === 'success' ? IconName.Confirmation : IconName.Danger
              }
              color={
                result === 'success'
                  ? IconColor.successDefault
                  : IconColor.errorDefault
              }
              size={IconSize.Xl}
              marginBottom={4}
            />
            <Text variant={TextVariant.bodyMdBold}>
              {t('keyringSnapRemovalResult1', [
                snapName,
                result === 'failed'
                  ? t('keyringSnapRemovalResultNotSuccessful')
                  : '',
              ])}
            </Text>
          </Box>
        </ModalContent>
      </Modal>
    </>
  );
};

export default KeyringSnapRemovalResult;
