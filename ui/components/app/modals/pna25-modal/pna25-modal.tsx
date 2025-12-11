import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
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
import { PNA25_BLOG_POST_LINK, Pna25NoticeAction } from './constants';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function Pna25Modal() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const trackEvent = useContext(MetaMetricsContext);

  const hasTrackedView = useRef(false);

  const handleAction = useCallback(
    (action: Pna25NoticeAction) => {
      trackEvent({
        event: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: {
          name: 'pna25',
          action,
        },
      });

      // Only acknowledge and close on user actions, not on initial view
      if (action !== Pna25NoticeAction.Viewed) {
        dispatch(setPna25Acknowledged(true));
      }

      if (action === Pna25NoticeAction.OpenSettings) {
        navigate(SECURITY_ROUTE);
      }
    },
    [trackEvent, dispatch, navigate],
  );

  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      handleAction(Pna25NoticeAction.Viewed);
    }
  }, [handleAction]);

  return (
    <Modal isOpen onClose={() => dispatch(setPna25Acknowledged(true))}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={() => handleAction(Pna25NoticeAction.Close)}>
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
              <TextButton
                asChild
                className="!text-inherit !font-normal underline underline-offset-2 [text-decoration-skip-ink:none] cursor-pointer hover:!text-inherit hover:!font-normal hover:![text-decoration-color:inherit] hover:!underline-offset-2 hover:!cursor-pointer"
              >
                <a
                  href={PNA25_BLOG_POST_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('pna25ModalBlogPostLink')}
                </a>
              </TextButton>
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => handleAction(Pna25NoticeAction.OpenSettings)}
              className="w-full"
              data-testid="pna25-modal-open-settings"
            >
              {t('openSettings')}
            </Button>
            <Button
              variant={ButtonVariant.Primary}
              onClick={() => handleAction(Pna25NoticeAction.AcceptAndClose)}
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
