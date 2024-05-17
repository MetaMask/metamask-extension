import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideDeleteMetaMetricsDataModal } from '../../../ducks/app/app';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
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
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { createMetaMetricsDataDeletionTask } from '../../../store/actions';
import {
  DataDeletionResponse,
  responseStatus,
} from '../../../../app/scripts/controllers/metametrics-data-deletion/metametrics-data-deletion';
import {
  getMetaMetricsDataDeletionDate,
  getMetaMetricsDataDeletionId,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

export default function ClearMetaMetricsData() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const id = useSelector(getMetaMetricsDataDeletionId);
  const date = useSelector(getMetaMetricsDataDeletionDate);

  function closeModal() {
    dispatch(hideDeleteMetaMetricsDataModal());
  }

  async function deleteMetaMetricsData() {
    try {
      const deleteResponse: DataDeletionResponse = (await dispatch(
        createMetaMetricsDataDeletionTask(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any;

      if (responseStatus.ok === deleteResponse?.status) {
        console.log(`${deleteResponse}---${id}----${date}`);
        if (participateInMetaMetrics) {
          trackEvent({
            category: MetaMetricsEventCategory.Settings,
            event: MetaMetricsEventName.MetricsDataDeletionRequest,
          });
        }
      }
    } catch (error: unknown) {
      // ignore
    } finally {
      dispatch(hideDeleteMetaMetricsDataModal());
    }
  }

  return (
    <Modal isOpen onClose={closeModal}>
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader onClose={closeModal}>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
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
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.bodySmMedium}>
            {t('deleteMetaMetricsDataModalDesc')}
          </Text>
        </Box>
        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Half}
              variant={ButtonVariant.Secondary}
              onClick={closeModal}
            >
              {t('cancel')}
            </Button>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Half}
              variant={ButtonVariant.Primary}
              onClick={deleteMetaMetricsData}
              danger
            >
              {t('clear')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
