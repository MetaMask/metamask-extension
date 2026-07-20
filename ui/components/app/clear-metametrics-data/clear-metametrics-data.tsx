import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  hideDeleteMetaMetricsDataModal,
  openDataDeletionErrorModal,
} from '../../../ducks/app/app';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { createMetaMetricsDataDeletionTask } from '../../../store/actions';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ClearMetaMetricsData({
  onDeletionSuccess,
}: {
  onDeletionSuccess?: () => void;
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const closeModal = () => {
    dispatch(hideDeleteMetaMetricsDataModal());
  };

  const deleteMetaMetricsData = async () => {
    try {
      await createMetaMetricsDataDeletionTask();
      trackEvent(
        createEventBuilder(MetaMetricsEventName.MetricsDataDeletionRequest)
          .addCategory(MetaMetricsEventCategory.Settings)
          .build({ excludeMetaMetricsId: true }),
      );
      onDeletionSuccess?.();
    } catch (error: unknown) {
      dispatch(openDataDeletionErrorModal());
      trackEvent(
        createEventBuilder(MetaMetricsEventName.ErrorOccured)
          .addCategory(MetaMetricsEventCategory.Settings)
          .build({ excludeMetaMetricsId: true }),
      );
    } finally {
      dispatch(hideDeleteMetaMetricsDataModal());
    }
  };

  return (
    <Modal isOpen onClose={closeModal}>
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader onClose={closeModal}>
          <Box
            className="flex"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <Text variant={TextVariant.headingSm}>
              {t('deleteMetaMetricsDataModalTitle')}
            </Text>
          </Box>
        </ModalHeader>
        <Box
          marginLeft={4}
          marginRight={4}
          marginBottom={3}
          className="flex"
          flexDirection={BoxFlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.bodySmMedium}>
            {t('deleteMetaMetricsDataModalDesc')}
          </Text>
        </Box>
        <ModalFooter>
          <Box className="flex" gap={4}>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Half}
              variant={ButtonVariant.Secondary}
              onClick={closeModal}
            >
              {t('cancel')}
            </Button>
            <Button
              data-testid="clear-metametrics-data"
              size={ButtonSize.Lg}
              width={BlockSize.Half}
              variant={ButtonVariant.Primary}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={deleteMetaMetricsData}
              danger
            >
              {t('delete')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
