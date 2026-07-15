import React, { useCallback } from 'react';
import { Box } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { openWindow } from '../../../../helpers/utils/window';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ModalBody,
  Text,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../../component-library';
import {
  TextVariant,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useSegmentContext } from '../../../../hooks/useSegmentContext';
import {
  buildSupportLinkWithUserData,
  type SupportLinkUserData,
} from '../../../../../shared/lib/build-support-link';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { useUserSubscriptions } from '../../../../hooks/subscription/useSubscription';
import { getCustomerServiceToken } from '../../../../store/actions';

type VisitSupportDataConsentModalProps = {
  onClose: () => void;
  isOpen: boolean;
};

const VisitSupportDataConsentModal = ({
  isOpen,
  onClose,
}: VisitSupportDataConsentModalProps) => {
  const version = process.env.METAMASK_VERSION as string;
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();
  const { customerId: shieldCustomerId } = useUserSubscriptions();

  const handleClickContactSupportButton = useCallback(() => {
    onClose();

    const openSupportLink = (customerServiceToken?: string) => {
      const params: SupportLinkUserData = {
        version,
        customerServiceToken,
        shieldCustomerId,
      };
      const supportLinkWithUserId = buildSupportLinkWithUserData(
        SUPPORT_LINK as string,
        params,
      );

      trackEvent(
        createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            url: supportLinkWithUserId,
            [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
          })
          .build(),
      );
      openWindow(supportLinkWithUserId);
    };

    getCustomerServiceToken()
      .then(openSupportLink)
      .catch(() => openSupportLink());
  }, [
    onClose,
    version,
    shieldCustomerId,
    trackEvent,
    createEventBuilder,
    segmentContext.page?.title,
  ]);

  const handleClickNoShare = useCallback(() => {
    onClose();

    trackEvent(
      createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
        .addCategory(MetaMetricsEventCategory.Settings)
        .addProperties({
          url: SUPPORT_LINK,
          [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
        })
        .build(),
    );
    openWindow(SUPPORT_LINK as string);
  }, [onClose, trackEvent, createEventBuilder, segmentContext.page?.title]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="visit-support-data-consent-modal"
      className="visit-support-data-consent-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('visitSupportDataConsentModalTitle')}</ModalHeader>
        <ModalBody
          paddingLeft={4}
          paddingRight={4}
          className="visit-support-data-consent-modal__body"
        >
          <Text variant={TextVariant.bodyMd}>
            {t('visitSupportDataConsentModalDescription')}
          </Text>
        </ModalBody>

        <ModalFooter>
          <Box className="flex" gap={4}>
            <ButtonSecondary
              size={ButtonSecondarySize.Lg}
              width={BlockSize.Half}
              onClick={handleClickNoShare}
              data-testid="visit-support-data-consent-modal-reject-button"
            >
              {t('visitSupportDataConsentModalReject')}
            </ButtonSecondary>
            <ButtonPrimary
              size={ButtonPrimarySize.Lg}
              width={BlockSize.Half}
              onClick={handleClickContactSupportButton}
              data-testid="visit-support-data-consent-modal-accept-button"
            >
              {t('visitSupportDataConsentModalAccept')}
            </ButtonPrimary>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VisitSupportDataConsentModal;
