import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  BlockSize,
  IconColor,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  Text,
  ModalFooter,
  Button,
  IconName,
  ButtonVariant,
  Icon,
  IconSize,
  ButtonSize,
} from '../../component-library';
import { hideDataDeletionErrorModal } from '../../../ducks/app/app';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DataDeletionErrorModal() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  function closeModal() {
    dispatch(hideDataDeletionErrorModal());
  }

  return (
    <Modal onClose={closeModal} isOpen>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader
          paddingBottom={4}
          paddingRight={6}
          paddingLeft={6}
          onClose={closeModal}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
          >
            <Icon
              size={IconSize.Xl}
              name={IconName.Danger}
              color={IconColor.warningDefault}
            />
            <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
              {t('deleteMetaMetricsDataErrorTitle')}
            </Text>
          </Box>
        </ModalHeader>

        <Box
          paddingLeft={6}
          paddingRight={6}
          display={Display.Flex}
          gap={4}
          flexDirection={FlexDirection.Column}
        >
          <Text variant={TextVariant.bodySm} textAlign={TextAlign.Justify}>
            {t('deleteMetaMetricsDataErrorDesc')}
          </Text>
        </Box>

        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Full}
              variant={ButtonVariant.Primary}
              onClick={closeModal}
            >
              {t('ok')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
