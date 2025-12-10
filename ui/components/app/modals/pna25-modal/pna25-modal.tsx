import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { SECURITY_ROUTE } from '../../../../helpers/constants/routes';
import { setPna25Acknowledged } from '../../../../store/actions';
import { PNA25_BLOG_POST_LINK } from './constants';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Pna25Modal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.NoticeUpdateDisplayed,
      properties: {
        name: 'pna25',
        action: 'viewed',
      },
    });
  }, [trackEvent]);

  const handleLeave = () => {
    trackEvent({
      event: MetaMetricsEventName.NoticeUpdateDisplayed,
      properties: {
        name: 'pna25',
        action: 'leave',
      },
    });
    dispatch(setPna25Acknowledged(true));
  };

  const handleClose = () => {
    trackEvent({
      event: MetaMetricsEventName.NoticeUpdateDisplayed,
      properties: {
        name: 'pna25',
        action: 'close',
      },
    });
    dispatch(setPna25Acknowledged(true));
  };

  const handleAccept = () => {
    trackEvent({
      event: MetaMetricsEventName.NoticeUpdateDisplayed,
      properties: {
        name: 'pna25',
        action: 'accept and close',
      },
    });
    dispatch(setPna25Acknowledged(true));
  };

  const handleOpenSettings = () => {
    trackEvent({
      event: MetaMetricsEventName.NoticeUpdateDisplayed,
      properties: {
        name: 'pna25',
        action: 'open settings',
      },
    });
    dispatch(setPna25Acknowledged(true));
    navigate(SECURITY_ROUTE);
  };

  return (
    <Modal isOpen onClose={handleLeave}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Icon name={IconName.ShieldLock} size={IconSize.Xl} />
            <Text variant={TextVariant.HeadingSm}>{t('pna25ModalTitle')}</Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text variant={TextVariant.BodyMd}>{t('pna25ModalBody1')}</Text>
            <Text variant={TextVariant.BodyMd}>{t('pna25ModalBody2')}</Text>
            <Text variant={TextVariant.BodyMd}>
              {t('pna25ModalBody3')}
              <TextButton asChild>
                <a
                  href={PNA25_BLOG_POST_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('pna25ModalBlogPostLink')}
                </a>
              </TextButton>
              .
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={handleOpenSettings}
              className="w-full"
              data-testid="pna25-modal-open-settings"
            >
              {t('openSettings')}
            </Button>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleAccept}
              className="w-full"
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
