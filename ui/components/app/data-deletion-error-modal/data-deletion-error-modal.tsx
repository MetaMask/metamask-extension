import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ModalHeader
          paddingBottom={4}
          paddingRight={6}
          paddingLeft={6}
          onClose={closeModal}
        >
          <Box
            className="flex"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
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
          className="flex"
          gap={4}
          flexDirection={BoxFlexDirection.Column}
        >
          <Text variant={TextVariant.bodySm} textAlign={TextAlign.Justify}>
            {t('deleteMetaMetricsDataErrorDesc')}
          </Text>
        </Box>

        <ModalFooter>
          <Box className="flex" gap={4}>
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
