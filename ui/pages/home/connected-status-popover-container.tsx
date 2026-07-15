import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { useI18nContext } from '../../hooks/useI18nContext';
import { setConnectedStatusPopoverHasBeenShown } from '../../store/actions';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../components/component-library';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import type { MetaMaskReduxState } from '../../store/store';
import { useAppDispatch } from '../../store/hooks';

export function ConnectedStatusPopoverContainer() {
  const t = useI18nContext();
  const dispatch = useAppDispatch();

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const connectedStatusPopoverHasBeenShown = useSelector(
    (state: MetaMaskReduxState) =>
      state.metamask.connectedStatusPopoverHasBeenShown,
  );

  const onDismiss = useCallback(() => {
    dispatch(setConnectedStatusPopoverHasBeenShown());
  }, [dispatch]);

  if (!isPopup || connectedStatusPopoverHasBeenShown) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={onDismiss}
      className="home__connected-status-popover"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onDismiss}>{t('whatsThis')}</ModalHeader>
        <ModalBody>
          <div className="home__connect-status-text">
            <div>{t('metaMaskConnectStatusParagraphOne')}</div>
            <div>{t('metaMaskConnectStatusParagraphTwo')}</div>
            <div>{t('metaMaskConnectStatusParagraphThree')}</div>
          </div>
        </ModalBody>
        <ModalFooter>
          <a
            href={ZENDESK_URLS.USER_GUIDE_DAPPS}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('learnMoreUpperCase')}
          </a>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Md}
            onClick={onDismiss}
          >
            {t('dismiss')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
