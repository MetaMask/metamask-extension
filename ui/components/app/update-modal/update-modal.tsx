import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  ModalHeader,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  BorderRadius,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  openUpdateTabAndReload,
  setUpdateModalLastDismissedAt,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function UpdateModal() {
  const t = useI18nContext();
  const [isLoading, setIsLoading] = useState(false);
  const { trackEvent } = useContext(MetaMetricsContext);

  // Track when modal is viewed
  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
      category: MetaMetricsEventCategory.App,
    });
  }, [trackEvent]);

  const handleClose = useCallback(async () => {
    trackEvent({
      event: MetaMetricsEventName.ForceUpgradeSkipped,
      category: MetaMetricsEventCategory.App,
    });
    await setUpdateModalLastDismissedAt(Date.now());
  }, [trackEvent]);

  const handleUpdate = useCallback(async () => {
    try {
      setIsLoading(true);
      trackEvent({
        event: MetaMetricsEventName.ForceUpgradeClickedUpdateToLatestVersion,
        category: MetaMetricsEventCategory.App,
      });
      await openUpdateTabAndReload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [trackEvent]);

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
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            borderRadius={BorderRadius.SM}
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
