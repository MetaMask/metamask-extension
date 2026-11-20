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

export type PayCheckListItem = {
  body: string;
  id: string;
  itemTestId?: string;
  title: React.ReactNode;
  titleTestId?: string;
};

export type PayCheckListProps = {
  className?: string;
  items: readonly PayCheckListItem[];
};

/**
 * Green-checkmark benefit list shared by MetaMask Pay info dialogs.
 */
export function PayCheckList({
  className = 'mt-1 flex flex-col gap-4',
  items,
}: Readonly<PayCheckListProps>) {
  return (
    <ul className={className}>
      {items.map(({ body, id, itemTestId, title, titleTestId }) => (
        <li
          key={id}
          className="flex items-start gap-4"
          data-testid={itemTestId}
        >
          <Icon
            className="mt-0.5 shrink-0"
            color={IconColor.SuccessDefault}
            name={IconName.Check}
            size={IconSize.Lg}
          />
          <div>
            <Text
              color={TextColor.TextDefault}
              data-testid={titleTestId}
              fontWeight={FontWeight.Medium}
              variant={TextVariant.BodyMd}
            >
              {title}
            </Text>
            <Text
              className="mt-1"
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
            >
              {body}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}
