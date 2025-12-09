import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonLink,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../component-library';
import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import { setPna25Acknowledged } from '../../../../store/actions';

const PNA25_BLOG_POST_LINK = '';

export default function Pna25Modal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.ToastDisplayed,
      properties: {
        toast_name: 'pna25',
        closed: false,
      },
    });
  }, [trackEvent]);

  const handleClose = () => {
    trackEvent({
      event: MetaMetricsEventName.ToastDisplayed,
      properties: {
        toast_name: 'pna25',
        closed: true,
      },
    });
    dispatch(setPna25Acknowledged(true));
  };

  const handleOpenSettings = () => {
    trackEvent({
      event: MetaMetricsEventName.ToastDisplayed,
      properties: {
        toast_name: 'pna25',
        closed: true,
        action: 'open_settings',
      },
    });
    dispatch(setPna25Acknowledged(true));
    navigate(SECURITY_ROUTE);
  };

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>{t('pna25ModalTitle')}</ModalHeader>
        <ModalBody>
          <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
            <Text variant={TextVariant.bodyMd}>{t('pna25ModalBody1')}</Text>
            <Text variant={TextVariant.bodyMd}>{t('pna25ModalBody2')}</Text>
            <Text variant={TextVariant.bodyMd}>
              {t('pna25ModalBody3')}
              <ButtonLink
                href={PNA25_BLOG_POST_LINK}
                externalLink
              >
                {t('pna25ModalBlogPostLink')}
              </ButtonLink>
              .
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={handleOpenSettings}
              block
              data-testid="pna25-modal-open-settings"
            >
              {t('openSettings')}
            </Button>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleClose}
              block
              data-testid="pna25-modal-accept"
            >
              {t('acceptAndClose')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

