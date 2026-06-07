import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

type Props = {
  item: ActivityListItem | undefined;
  onBack: () => void;
};

function getTitleKey(item: ActivityListItem | undefined) {
  if (!item) {
    return undefined;
  }

  return `activity_${item.type}_${item.status}_title`;
}

function getDefinedArgs(...args: (string | undefined)[]) {
  return args.filter((arg) => Boolean(arg));
}

function getTitleArgs(item: ActivityListItem) {
  switch (item.type) {
    case 'swap': {
      return getDefinedArgs(
        item.data.sourceToken?.symbol,
        item.data.destinationToken?.symbol,
      );
    }
    case 'convert': {
      return getDefinedArgs(
        item.data.destinationToken?.symbol ?? item.data.sourceToken?.symbol,
      );
    }
    case 'bridge':
    case 'wrap':
    case 'unwrap': {
      return getDefinedArgs(item.data.sourceToken?.symbol);
    }
    case 'lendingWithdrawal': {
      return getDefinedArgs(
        item.data.sourceToken?.symbol ?? item.data.destinationToken?.symbol,
      );
    }
    case 'send':
    case 'receive':
    case 'buy':
    case 'claim':
    case 'claimMusdBonus':
    case 'deposit':
    case 'nftBuy':
    case 'nftMint': {
      return getDefinedArgs(item.data.token?.symbol);
    }
    case 'swapIncomplete': {
      return getDefinedArgs(item.data.sourceToken?.symbol);
    }
    default:
      return [];
  }
}

export function Header({ item, onBack }: Props) {
  const t = useI18nContext();
  const titleKey = getTitleKey(item);
  const title = titleKey ? t(titleKey, item ? getTitleArgs(item) : []) : null;

  return (
    <Box className="grid grid-cols-[40px_1fr_40px] items-center pb-8">
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Sm}
        onClick={onBack}
      />
      {title ? <Text className="text-center font-medium">{title}</Text> : null}
    </Box>
  );
}
