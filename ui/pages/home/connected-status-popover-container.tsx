import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { useI18nContext } from '../../hooks/useI18nContext';
import { setConnectedStatusPopoverHasBeenShown } from '../../store/actions';
import Popover from '../../components/ui/popover';
import Button from '../../components/ui/button';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import type { MetaMaskReduxState } from '../../store/store';

export function ConnectedStatusPopoverContainer() {
  const t = useI18nContext();
  const dispatch = useDispatch();

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
    <Popover
      title={t('whatsThis')}
      onClose={onDismiss}
      className="home__connected-status-popover"
      showArrow
      CustomBackground={(bgProps: { onClose: () => void }) => {
        return (
          <div
            className="home__connected-status-popover-bg-container"
            onClick={bgProps.onClose}
          >
            <div className="home__connected-status-popover-bg" />
          </div>
        );
      }}
      footer={
        <>
          <a
            href={ZENDESK_URLS.USER_GUIDE_DAPPS}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('learnMoreUpperCase')}
          </a>
          <Button type="primary" onClick={onDismiss}>
            {t('dismiss')}
          </Button>
        </>
      }
    >
      <main className="home__connect-status-text">
        <div>{t('metaMaskConnectStatusParagraphOne')}</div>
        <div>{t('metaMaskConnectStatusParagraphTwo')}</div>
        <div>{t('metaMaskConnectStatusParagraphThree')}</div>
      </main>
    </Popover>
  );
}
