import React from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  ContentVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  SensitiveTextLength,
  TextColor,
} from '@metamask/design-system-react';
import { useMoneyActivityDisplayInfo } from '../../../hooks/money/use-money-activity-display';
import type { MoneyActivityItem } from '../types/money-activity';

export type MoneyActivityRowProps = {
  item: MoneyActivityItem;
  privacyMode?: boolean;
  onItemClick?: (item: MoneyActivityItem) => void;
};

function getAmountColor({
  isFailed,
  isIncoming,
}: {
  isFailed: boolean;
  isIncoming: boolean;
}) {
  if (isFailed) {
    return TextColor.TextAlternative;
  }
  if (isIncoming) {
    return TextColor.SuccessDefault;
  }
  return TextColor.TextDefault;
}

export function MoneyActivityRow({
  item,
  privacyMode = false,
  onItemClick,
}: MoneyActivityRowProps) {
  const display = useMoneyActivityDisplayInfo(item);
  const isFailed = display.status === 'failed';
  const isPending = display.status === 'pending';
  const amountColor = getAmountColor({
    isFailed,
    isIncoming: display.isIncoming,
  });
  const isClickable = Boolean(onItemClick);

  return (
    <ListItem
      variant={
        display.description ? ContentVariant.TwoLines : ContentVariant.OneLine
      }
      isInteractive={isClickable}
      onClick={isClickable ? () => onItemClick?.(item) : undefined}
      className={isClickable ? 'hover:bg-hover' : undefined}
      data-testid={`money-activity-row-${item.id}`}
      avatar={
        <AvatarIcon
          iconName={display.icon}
          severity={AvatarIconSeverity.Neutral}
          size={AvatarIconSize.Lg}
          className="shrink-0"
        />
      }
      title={display.label}
      titleProps={{
        color: isFailed ? TextColor.ErrorDefault : TextColor.TextDefault,
        className: 'min-w-0 truncate',
      }}
      titleEndAccessory={
        isPending ? (
          <Icon
            name={IconName.Loading}
            size={IconSize.Sm}
            color={IconColor.IconDefault}
            className="animate-spin"
            aria-hidden
          />
        ) : undefined
      }
      description={display.description}
      descriptionProps={{ className: 'truncate' }}
      value={display.primaryAmount}
      valueProps={{
        color: amountColor,
        isHidden: privacyMode,
        length: SensitiveTextLength.Medium,
        className: 'text-right',
        'data-testid': `money-activity-row-primary-${item.id}`,
      }}
      subvalue={display.fiatAmount}
      subvalueProps={{
        isHidden: privacyMode,
        length: SensitiveTextLength.Short,
        className: 'text-right',
        'data-testid': `money-activity-row-fiat-${item.id}`,
      }}
    />
  );
}
