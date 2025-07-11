import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectSessionData } from '../../../../selectors/identity/authentication';
import { getMetaMetricsId } from '../../../../selectors/selectors';
import { openWindow } from '../../../../helpers/utils/window';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Box,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ModalBody,
  Text,
  ButtonSecondary,
  ButtonSecondarySize,
} from '../../../component-library';
import {
  Display,
  TextVariant,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';

type VisitSupportDataConsentModalProps = {
  onClose: () => void;
  isOpen: boolean;
};

const VisitSupportDataConsentModal: React.FC<
  VisitSupportDataConsentModalProps
> = ({ isOpen, onClose }) => {
  const version = process.env.METAMASK_VERSION as string;
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const sessionData = useSelector(selectSessionData);
  const profileId = sessionData?.profile?.profileId;
  const metaMetricsId = useSelector(getMetaMetricsId);

  const handleClickContactSupportButton = useCallback(
    (params: {
      version: string;
      profileId?: string;
      metaMetricsId?: string;
    }) => {
      onClose();
      let supportLinkWithUserId = SUPPORT_LINK as string;
      const queryParams = new URLSearchParams();
      queryParams.append('metamask_version', params.version);
      if (params.profileId) {
        queryParams.append('metamask_profile_id', params.profileId);
      }
      if (params.metaMetricsId) {
        queryParams.append('metamask_metametrics_id', params.metaMetricsId);
      }

      const queryString = queryParams.toString();
      if (queryString) {
        supportLinkWithUserId += `?${queryString}`;
      }

      trackEvent(
        {
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.SupportLinkClicked,
          properties: {
            url: supportLinkWithUserId,
          },
        },
        {
          contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
        },
      );
      openWindow(supportLinkWithUserId);
    },
    [onClose, trackEvent],
  );

  const handleClickNoShare = useCallback(() => {
    onClose();
    trackEvent(
      {
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
    openWindow(SUPPORT_LINK as string);
  }, [onClose, trackEvent]);

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
          <Box display={Display.Flex} gap={4}>
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
              onClick={() =>
                handleClickContactSupportButton({
                  version,
                  profileId,
                  metaMetricsId,
                })
              }
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
