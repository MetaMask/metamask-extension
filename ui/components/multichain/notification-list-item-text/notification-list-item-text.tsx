import React, { FC } from 'react';

import { Text } from '../../component-library';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

export interface NotificationListItemTextItemProps {
  text: string;
  highlighted?: boolean;
}

export interface NotificationListItemTextProps {
  items: NotificationListItemTextItemProps[];
  variant?: TextVariant;
  color?: TextColor;
}

/**
 * A component to render a list of notification item titles
 *
 * @param props - The properties of the component
 * @param props.items - The list of items to render
 * @param props.variant - The text variant of the component
 * @param props.color - The text color of the component
 * @returns A JSX element
 */
export const NotificationListItemText: FC<NotificationListItemTextProps> = ({
  items,
  variant = TextVariant.bodySm,
  color = TextColor.textDefault,
}) => {
  const renderItems = items.map(({ text, highlighted }, index) => {
    const key = `${text
      .replace(/\s+/gu, '_')
      .replace(/[^\w-]/gu, '')}-${index}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    const textColor = highlighted ? TextColor.infoDefault : color;
    const separator = index !== items.length - 1 && ' ';

    return (
      <Text
        key={key}
        as="span"
        variant={TextVariant.inherit}
        fontWeight={FontWeight.Normal}
        color={textColor}
      >
        {text}
        {separator}
      </Text>
    );
  });

  return (
    <Text as="p" variant={variant}>
      {renderItems}
    </Text>
  );
};
