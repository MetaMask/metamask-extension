import React from 'react';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

export type MoneyCheckListItem = {
  id: string;
  title: React.ReactNode;
  body: string;
  titleTestId?: string;
  itemTestId?: string;
};

export type MoneyCheckListProps = {
  items: readonly MoneyCheckListItem[];
  className?: string;
};

/**
 * Green-checkmark benefit list shared by Money deposit info dialogs.
 */
export function MoneyCheckList({
  items,
  className = 'mt-1 flex flex-col gap-4',
}: Readonly<MoneyCheckListProps>) {
  return (
    <ul className={className}>
      {items.map(({ id, title, body, titleTestId, itemTestId }) => (
        <li
          key={id}
          className="flex items-start gap-4"
          data-testid={itemTestId}
        >
          <Icon
            name={IconName.Check}
            size={IconSize.Lg}
            color={IconColor.SuccessDefault}
            className="mt-0.5 shrink-0"
          />
          <div>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              data-testid={titleTestId}
            >
              {title}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="mt-1"
            >
              {body}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}
