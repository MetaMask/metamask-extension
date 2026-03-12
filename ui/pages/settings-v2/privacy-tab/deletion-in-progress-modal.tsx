import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSelector } from 'react-redux';
import { getMetaMetricsDataDeletionTimestamp } from '../../../selectors';
import { formatDate } from '../../../helpers/utils/util';
import { PrivacyPolicyLink } from '../shared';

type DeletionInProgressModalProps = {
  onClose: () => void;
};

export default function DeletionInProgressModal({
  onClose,
}: Readonly<DeletionInProgressModalProps>) {
  const t = useI18nContext();
  const metaMetricsDataDeletionTimestamp = useSelector(
    getMetaMetricsDataDeletionTimestamp,
  );
  const formatedDate = formatDate(metaMetricsDataDeletionTimestamp, 'd/MM/y');

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader onClose={onClose}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <Text
              variant={TextVariant.HeadingSm}
              fontWeight={FontWeight.Medium}
            >
              {t('deleteMetaMetricsDataModalTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <Box
          marginHorizontal={4}
          marginBottom={3}
          flexDirection={BoxFlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('deleteMetaMetricsDataRequestedDescription', [
                  formatedDate,
                  <PrivacyPolicyLink key="deletion-in-progress-modal-privacy-link" />,
                ])}
          </Text>
        </Box>
        <ModalFooter>
          <Box className="flex gap-4">
            <Button
              className="flex-1"
              variant={ButtonVariant.Secondary}
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button
              className="flex-1"
              variant={ButtonVariant.Primary}
              isDanger
              disabled
            >
              {t('delete')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
