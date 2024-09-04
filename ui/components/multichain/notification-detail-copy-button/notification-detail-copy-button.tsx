import React, { useContext } from 'react';
import type { FC } from 'react';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { MetaMetricsContext } from '../../../contexts/metametrics';
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
import { MINUTE } from '../../../../shared/constants/time';

type Notification = NotificationServicesController.Types.INotification;
const { TRIGGER_TYPES } = NotificationServicesController.Constants;

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
export const NotificationDetailCopyButton: FC<
  NotificationDetailCopyButtonProps
> = ({
  notification,
  text,
  displayText,
  color = TextColor.textAlternative,
}): JSX.Element => {
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const tooltipText = copied ? t('copiedExclamation') : t('copyToClipboard');
  const tooltipTitle = tooltipText;

  const onClick = () => {
    typeof handleCopy === 'function' && handleCopy(text);
    if (notification) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationInteraction,
        event: MetaMetricsEventName.NotificationDetailClicked,
        properties: {
          notification_id: notification.id,
          notification_type: notification.type,
          ...(notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT && {
            chain_id: notification?.chain_id,
          }),
          clicked_item: 'tx_id',
        },
      });
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
