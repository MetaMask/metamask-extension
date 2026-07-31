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
import { createMetaMetricsDataDeletionTask } from '../../../store/actions';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { captureException } from '../../../../shared/lib/sentry';
import { PrivacyPolicyLink } from '../shared';

type DeleteMetametricsModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  onError: () => void;
};

export default function DeleteMetametricsModal({
  onClose,
  onSuccess,
  onError,
}: Readonly<DeleteMetametricsModalProps>) {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const deleteMetaMetricsData = async () => {
    try {
      await createMetaMetricsDataDeletionTask();
      trackEvent(
        createEventBuilder(MetaMetricsEventName.MetricsDataDeletionRequest)
          .addCategory(MetaMetricsEventCategory.Settings)
          .build({ excludeMetaMetricsId: true }),
      );
      onSuccess();
    } catch (error) {
      captureException(error);
      trackEvent(
        createEventBuilder(MetaMetricsEventName.ErrorOccured)
          .addCategory(MetaMetricsEventCategory.Settings)
          .build({ excludeMetaMetricsId: true }),
      );
      onError();
    } finally {
      onClose();
    }
  };

  return (
    <Modal isOpen onClose={onClose} data-testid="delete-metametrics-modal">
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
            {t('deleteMetaMetricsDataDescriptionV2', [
              <PrivacyPolicyLink key="delete-metametrics-modal-privacy-link" />,
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
              data-testid="clear-metametrics-data"
              className="flex-1"
              variant={ButtonVariant.Primary}
              isDanger
              onClick={deleteMetaMetricsData}
            >
              {t('delete')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
