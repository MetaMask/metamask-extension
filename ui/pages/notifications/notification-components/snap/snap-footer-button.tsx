import React, { useCallback, useContext, useState } from 'react';
import useSnapNavigation from '../../../../hooks/snaps/useSnapNavigation';
import SnapLinkWarning from '../../../../components/app/snaps/snap-link-warning';
import { NotificationDetailButton } from '../../../../components/multichain';
import { ButtonVariant } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { DetailedViewData, SnapNotification } from './types';

export const SnapFooterButton = (props: { notification: SnapNotification }) => {
  const { trackEvent } = useContext(MetaMetricsContext);
  const { useSnapNavigate } = useSnapNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const data = props.notification.data as DetailedViewData;
  const footer = data?.detailedView?.footerLink;

  const handleModalClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onClick = useCallback(
    (href: string, isExternal: boolean) => {
      // Analytics
      trackEvent({
        category: MetaMetricsEventCategory.NotificationInteraction,
        event: MetaMetricsEventName.NotificationDetailClicked,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          notification_id: props.notification.id,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          notification_type: props.notification.type,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          clicked_item: isExternal ? 'external_link' : 'internal_link',
        },
      });

      // Warning / Navigation
      if (isExternal) {
        setIsOpen(true);
        return;
      }
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/rules-of-hooks
      useSnapNavigate(href);
    },
    [
      useSnapNavigate,
      props.notification.id,
      props.notification.type,
      trackEvent,
    ],
  );

  if (!footer) {
    return null;
  }

  const { href, text } = footer;
  const isMetaMaskUrl = href.startsWith('metamask:');
  const isExternal = !isMetaMaskUrl;

  return (
    <>
      <SnapLinkWarning isOpen={isOpen} onClose={handleModalClose} url={href} />
      <NotificationDetailButton
        variant={ButtonVariant.Secondary}
        isExternal={isExternal}
        text={text}
        onClick={() => onClick(href, isExternal)}
      />
    </>
  );
};
