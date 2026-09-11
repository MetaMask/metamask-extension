import React from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getMoneyActivityDisplayInfo,
  type MoneyActivityTranslate,
} from '../utils/money-activity-display';
import type { MoneyActivityItem } from '../types/money-activity';

export type MoneyActivityRowProps = {
  item: MoneyActivityItem;
  privacyMode?: boolean;
  onClick?: () => void;
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
  onClick,
}: MoneyActivityRowProps) {
  const t = useI18nContext() as MoneyActivityTranslate;
  const display = getMoneyActivityDisplayInfo(item.tx, t);
  const isFailed = display.status === 'failed';
  const isPending = display.status === 'pending';
  const amountColor = getAmountColor({
    isFailed,
    isIncoming: display.isIncoming,
  });

  const content = (
    <>
      <AvatarIcon
        iconName={display.icon}
        severity={AvatarIconSeverity.Neutral}
        size={AvatarIconSize.Lg}
        className="shrink-0"
      />
      <Box className="min-w-0 flex-1" flexDirection={BoxFlexDirection.Column}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={isFailed ? TextColor.ErrorDefault : TextColor.TextDefault}
            className="min-w-0 truncate"
          >
            {display.label}
          </Text>
          {isPending ? (
            <Icon
              name={IconName.Loading}
              size={IconSize.Sm}
              color={IconColor.IconDefault}
              className="animate-spin"
              aria-hidden
            />
          ) : null}
        </Box>
        {display.description ? (
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
            className="truncate"
          >
            {display.description}
          </Text>
        ) : null}
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        justifyContent={BoxJustifyContent.Center}
        className="shrink-0"
      >
        <SensitiveText
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={amountColor}
          isHidden={privacyMode}
          length={SensitiveTextLength.Medium}
          className="text-right"
          data-testid={`money-activity-row-primary-${item.id}`}
        >
          {display.primaryAmount}
        </SensitiveText>
        <SensitiveText
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
          isHidden={privacyMode}
          length={SensitiveTextLength.Short}
          className="text-right"
          data-testid={`money-activity-row-fiat-${item.id}`}
        >
          {display.fiatAmount}
        </SensitiveText>
      </Box>
    </>
  );

  const rowClassName = 'flex w-full items-center gap-4 p-4';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${rowClassName} bg-transparent text-left hover:bg-hover`}
        data-testid={`money-activity-row-${item.id}`}
      >
        {content}
      </button>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      padding={4}
      className="w-full"
      data-testid={`money-activity-row-${item.id}`}
    >
      {content}
    </Box>
  );
}
