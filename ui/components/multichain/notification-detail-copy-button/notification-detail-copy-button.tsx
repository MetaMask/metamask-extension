import React from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { isOnChainNotification } from '@metamask/notification-services-controller/notification-services';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  ButtonBase,
  IconName,
  Box,
  ButtonBaseSize,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import Tooltip from '../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';

type Notification = NotificationServicesController.Types.INotification;

export type NotificationDetailCopyButtonProps = {
  notification?: Notification;
  text: string;
  displayText: string;
  color?: TextColor;
};

/**
 * A component to display a button that copies a given text to the clipboard when clicked.
 * The button includes a tooltip that displays a message based on whether the text has been copied or not.
 *
 * @param props - The component props.
 * @param props.notification - The notification object.
 * @param props.text - The text to be copied when the button is clicked.
 * @param props.displayText - The text to be displayed on the button.
 * @param [props.color] - The color of the text.
 * @returns The rendered component.
 */
export const NotificationDetailCopyButton = ({
  notification,
  text,
  displayText,
  color = TextColor.textAlternative,
}: NotificationDetailCopyButtonProps): JSX.Element => {
  // useCopyToClipboard analysis: Copies the text of the notification detail, which is never a private key
  const [copied, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();

  const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');
  const tooltipTitle = tooltipText;

  const onClick = () => {
    typeof handleCopy === 'function' && handleCopy(text);
    if (notification) {
      const otherNotificationProperties = () => {
        if (
          'notification_type' in notification &&
          isOnChainNotification(notification) &&
          notification.payload.chain_id
        ) {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          return { chain_id: notification.payload.chain_id };
        }

        return undefined;
      };

      trackEvent(
        createEventBuilder(MetaMetricsEventName.NotificationDetailClicked)
          .addCategory(MetaMetricsEventCategory.NotificationInteraction)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            notification_id: notification.id,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            notification_type: notification.type,
            ...otherNotificationProperties(),
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            clicked_item: 'tx_id',
          })
          .build(),
      );
    }
  };

  return (
    <Tooltip position="bottom" title={tooltipTitle}>
      <ButtonBase
        backgroundColor={BackgroundColor.transparent}
        onClick={onClick}
        paddingRight={0}
        paddingLeft={0}
        variant={TextVariant.bodyMd}
        fontWeight={FontWeight.Normal}
        color={color}
        endIconName={copied ? IconName.CopySuccess : IconName.Copy}
        alignItems={AlignItems.center}
        data-testid="address-copy-button-text"
        size={ButtonBaseSize.Sm}
      >
        <Box display={Display.Flex}>{displayText}</Box>
      </ButtonBase>
    </Tooltip>
  );
};
