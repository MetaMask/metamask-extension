import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  HeaderBase,
  IconName,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
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
  return args.map((arg) => arg ?? '');
}

function getTitleArgs(item: ActivityListItem) {
  switch (item.type) {
    case 'swap': {
      const args = getDefinedArgs(
        item.data.sourceToken?.symbol,
        item.data.destinationToken?.symbol,
      );

      return args.length === 2 && args.every(Boolean) ? args : undefined;
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
    case 'nftMint':
    case 'nftSell': {
      return getDefinedArgs(item.data.token?.symbol);
    }
    case 'swapIncomplete': {
      return getDefinedArgs(item.data.sourceToken?.symbol);
    }
    default:
      return [''];
  }
}

export function Header({ item, onBack }: Props) {
  const t = useI18nContext();
  const titleKey = getTitleKey(item);
  const titleArgs = item ? getTitleArgs(item) : undefined;
  const title =
    titleKey && titleArgs?.length ? t(titleKey, titleArgs) : item?.type;

  return (
    <HeaderBase
      startAccessory={
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          size={ButtonIconSize.Md}
          onClick={onBack}
          data-testid="transaction-details-back-button"
        />
      }
    >
      {title ? (
        <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
          {title}
        </Text>
      ) : null}
    </HeaderBase>
  );
}
