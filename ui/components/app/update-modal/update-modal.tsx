import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Text,
  ModalHeader,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  FlexDirection,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  openUpdateTabAndReload,
  setUpdateModalLastDismissedAt,
} from '../../../store/actions';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function UpdateModal() {
  const t = useI18nContext();
  const [isLoading, setIsLoading] = useState(false);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTrackedView = useRef(false);

  // Track when modal is viewed
  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }
    hasTrackedView.current = true;
    trackEvent(
      createEventBuilder(
        MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
      )
        .addCategory(MetaMetricsEventCategory.App)
        .build(),
    );
  }, [createEventBuilder, trackEvent]);

  const handleClose = useCallback(async () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ForceUpgradeSkipped)
        .addCategory(MetaMetricsEventCategory.App)
        .build(),
    );
    await setUpdateModalLastDismissedAt(Date.now());
  }, [createEventBuilder, trackEvent]);

  const handleUpdate = useCallback(async () => {
    try {
      setIsLoading(true);
      trackEvent(
        createEventBuilder(
          MetaMetricsEventName.ForceUpgradeClickedUpdateToLatestVersion,
        )
          .addCategory(MetaMetricsEventCategory.App)
          .build(),
      );
      await openUpdateTabAndReload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [createEventBuilder, trackEvent]);

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      data-testid="update-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleClose}
          startAccessory={true}
          closeButtonProps={{ 'data-testid': 'update-modal-close-button' }}
        />
        <ModalBody display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box
            className="flex rounded-sm"
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            padding={10}
          >
            <img src="/images/logo/metamask-fox.svg" width={160} height={160} />
          </Box>
          <Text variant={TextVariant.headingMd} textAlign={TextAlign.Center}>
            {t('getTheNewestFeatures')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            padding={4}
            paddingBottom={12}
          >
            {t('updateInformation')}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={handleUpdate}
          submitButtonProps={{
            children: t('updateToTheLatestVersion'),
            loading: isLoading,
            disabled: isLoading,
            block: true,
            'data-testid': 'update-modal-submit-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
}

export default UpdateModal;
