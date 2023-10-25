import React from 'react';
import { useSelector } from 'react-redux';
import {
  FlexDirection,
  AlignItems,
  Display,
  JustifyContent,
  IconColor,
  TextVariant,
  TextAlign,
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
import { getKeyringSnapRemovalResult } from '../../../../selectors';

const KeyringSnapRemovalResult = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const t = useI18nContext();
  const snapRemovalResult = useSelector(getKeyringSnapRemovalResult);

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
                snapRemovalResult.result === 'success'
                  ? IconName.Confirmation
                  : IconName.Danger
              }
              color={
                snapRemovalResult.result === 'success'
                  ? IconColor.successDefault
                  : IconColor.errorDefault
              }
              size={IconSize.Xl}
              marginBottom={4}
            />
            <Text variant={TextVariant.bodyMdBold} textAlign={TextAlign.Center}>
              {t('keyringSnapRemovalResult1', [
                snapRemovalResult.snapName,
                snapRemovalResult.result === 'failed'
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
