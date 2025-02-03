import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox,
  Box,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonLink,
  ModalBody,
  Text,
  IconSize,
  IconName,
  Icon,
  Button,
  ButtonSecondarySize,
} from '../../../../components/component-library/index';

import {
  JustifyContent,
  Display,
  TextVariant,
  TextColor,
  IconColor,
  FlexDirection,
  AlignItems,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { SUPPORT_LINK } from '../../../../../shared/lib/ui-utils';
import { openWindow } from '../../../../helpers/utils/window';
import { ButtonSecondary } from '../../../../components/component-library/button-secondary/button-secondary';

type VisitSupportDataConsentModalProps = {
  onClose: () => void;
  isOpen: boolean;
};

const VisitSupportDataConsentModal: React.FC<
  VisitSupportDataConsentModalProps
> = ({ isOpen, onClose }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [isPreferenceChecked, setIsPreferenceChecked] = useState(false);

  const clickContactSupportButton = () => {
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
    openWindow(SUPPORT_LINK);
  };

  const togglePreferenceCheck = useCallback(() => {
    setIsPreferenceChecked(
      (isPreferenceCheckedValue) => !isPreferenceCheckedValue,
    );
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="visit-support-data-consent-modal"
      className="visit-support-data-consent-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('visitSupportDataConsentModalTitle')}
        </ModalHeader>
        <ModalBody
          paddingLeft={4}
          paddingRight={4}
          className="visit-support-data-consent-modal__body"
        >
          <Text variant={TextVariant.bodyMd}>
            {t('visitSupportDataConsentModalDescription')}
          </Text>
          <Checkbox
            id="save-my-preference-checkbox"
            className="visit-support-data-consent-modal__body__preference-checkbox"
            data-testid="save-my-preference-checkbox"
            label={t('visitSupportDataConsentModalCheckboxDescription')}
            isChecked={isPreferenceChecked}
            onChange={togglePreferenceCheck}
            alignItems={AlignItems.flexStart}
          />
        </ModalBody>

        <ModalFooter>
          <Box display={Display.Flex} gap={4}>
            <ButtonSecondary
              size={ButtonSecondarySize.Lg}
              width={BlockSize.Half}
              onClick={onClose}
            >
              {t('visitSupportDataConsentModalReject')}
            </ButtonSecondary>
            <ButtonPrimary size={ButtonPrimarySize.Lg} width={BlockSize.Half}>
              {t('visitSupportDataConsentModalAccept')}
            </ButtonPrimary>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VisitSupportDataConsentModal;
