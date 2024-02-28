import React from 'react';
import type { FC } from 'react';

import { NotificationDetail } from '../notification-detail';
import { AvatarIcon, IconName, Text } from '../../component-library';
import {
  BackgroundColor,
  FontWeight,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

interface IconProps {
  iconName: IconName;
  color: TextColor;
  backgroundColor: BackgroundColor;
}

export interface NotificationDetailInfoProps {
  icon: IconProps;
  label: string;
  detail: string;
  action?: JSX.Element;
}

/**
 * A component to display a notification detail with an icon, a label, a detail, and an action.
 *
 * @param props - The component props.
 * @param props.icon - The icon to display.
 * @param props.label - The label to display.
 * @param props.detail - The detail to display.
 * @param [props.action] - The action to display.
 * @returns The rendered component.
 */
export const NotificationDetailInfo: FC<NotificationDetailInfoProps> = ({
  icon,
  label,
  detail,
  action,
}): JSX.Element => {
  return (
    <NotificationDetail
      icon={<AvatarIcon {...icon} />}
      primaryTextLeft={
        <Text
          variant={TextVariant.bodyLgMedium}
          fontWeight={FontWeight.Medium}
          color={TextColor.textDefault}
        >
          {label}
        </Text>
      }
      secondaryTextLeft={
        <Text
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Normal}
          color={TextColor.textAlternative}
        >
          {detail}
        </Text>
      }
      secondaryTextRight={action}
    />
  );
};
