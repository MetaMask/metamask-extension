import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { I18nContext } from '../../../../contexts/i18n';
import { useModalProps } from '../../../../hooks/useModalProps';
import { useMetamaskNotificationsContext } from '../../../../contexts/metamask-notifications/metamask-notifications';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import {
  selectIsMetamaskNotificationsEnabled,
  getIsUpdatingMetamaskNotifications,
} from '../../../../selectors/metamask-notifications/metamask-notifications';
import { selectIsBackupAndSyncEnabled } from '../../../../selectors/identity/backup-and-sync';
import { useEnableNotifications } from '../../../../hooks/metamask-notifications/useNotifications';
import { NOTIFICATIONS_ROUTE } from '../../../../helpers/constants/routes';

import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  ModalFooter,
} from '../../../component-library';
import {
  AlignItems,
  BlockSize,
  BorderRadius,
  FlexDirection,
  FontWeight,
  TextColor,
} from '../../../../helpers/constants/design-system';

export default function TurnOnMetamaskNotifications() {
  const { hideModal } = useModalProps();
  const history = useHistory();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const { listNotifications } = useMetamaskNotificationsContext();

  const isNotificationEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const [isLoading, setIsLoading] = useState<boolean>(
    isUpdatingMetamaskNotifications,
  );

  const { enableNotifications, error } = useEnableNotifications();

  const handleTurnOnNotifications = async () => {
    setIsLoading(true);
    trackEvent({
      category: MetaMetricsEventCategory.NotificationsActivationFlow,
      event: MetaMetricsEventName.NotificationsActivated,
      properties: {
        is_profile_syncing_enabled: true,
        action_type: 'activated',
      },
    });
    await enableNotifications();
  };

  const handleHideModal = () => {
    hideModal();
    setIsLoading((prevLoadingState) => {
      if (!prevLoadingState) {
        trackEvent({
          category: MetaMetricsEventCategory.NotificationsActivationFlow,
          event: MetaMetricsEventName.NotificationsActivated,
          properties: {
            is_profile_syncing_enabled: isBackupAndSyncEnabled,
            action_type: 'dismissed',
          },
        });
      }
      return prevLoadingState;
    });
  };

  useEffect(() => {
    if (isNotificationEnabled && !error) {
      history.push(NOTIFICATIONS_ROUTE);
      hideModal();
      listNotifications();
    }
  }, [isNotificationEnabled, error, history, hideModal, listNotifications]);

  const items = [
    {
      title: t('noticesModalItem1Title'),
      desc: t('noticesModalItem1Desc'),
    },
    {
      title: t('noticesModa2Item1Title'),
      desc: t('noticesModa2Item1Desc'),
    },
  ];
  return (
    <Modal isOpen onClose={() => handleHideModal()}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={() => handleHideModal()}>
          {t('turnOnMetamaskNotifications')}
        </ModalHeader>
        <ModalBody>
          <Box className="notices">
            <Box className="notices__content">
              <Box className="notices__content__text">
                <Text as="p" className="notices__content__text__title">
                  {t('noticesModalTitle')}
                </Text>
                <Text as="p">{t('noticesModalDesc')}</Text>
              </Box>
              <Box className="notices__content__items">
                {items.map((item, index) => {
                  return (
                    <Box
                      className="notices__content__items__ItemBox"
                      key={index}
                    >
                      <Box className="notices__content__items__ItemBox__item">
                        <img
                          className="notices__content__items__ItemBox__item__icon"
                          src="./images/icon-logo.svg"
                        />
                        <Box className="notices__content__items__ItemBox__item__center">
                          <Text
                            as="p"
                            className="notices__content__items__ItemBox__item__center__label"
                          >
                            {item.title}
                          </Text>
                          <Text
                            as="p"
                            className="notices__content__items__ItemBox__item__center__desc"
                          >
                            {item.desc}
                          </Text>
                        </Box>
                        <Text
                          as="span"
                          className="notices__content__items__ItemBox__item__now"
                        >
                          {t('noticesModalNow')}
                        </Text>
                      </Box>
                      <Box className="notices__content__items__ItemBox__bg"></Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          paddingTop={4}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={() => handleTurnOnNotifications()}
          containerProps={{
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.stretch,
          }}
          submitButtonProps={{
            children: t('turnOnMetamaskNotificationsButton'),
            loading: isLoading,
            disabled: isLoading,
            'data-testid': 'turn-on-notifications-button',
          }}
        />
        {error && (
          <Box paddingLeft={4} paddingRight={4}>
            <Text as="p" color={TextColor.errorDefault} paddingTop={4}>
              {t('done')}
            </Text>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
}
