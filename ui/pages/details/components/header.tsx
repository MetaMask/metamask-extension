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

function getDefinedArgs(...args: (string | undefined)[]) {
  return args.map((arg) => arg ?? '');
}

function getTitleConfig(item: ActivityListItem | undefined) {
  if (!item) {
    return undefined;
  }

  const key = `activity_${item.type}_${item.status}_title`;

  switch (item.type) {
    case 'swap': {
      const sourceSymbol = item.data.sourceToken?.symbol;
      const destinationSymbol = item.data.destinationToken?.symbol;

      if (!destinationSymbol) {
        return {
          key: `activity_swapIncomplete_${item.status}_title`,
          args: getDefinedArgs(sourceSymbol),
        };
      }

      return {
        key,
        args: getDefinedArgs(sourceSymbol, destinationSymbol),
      };
    }
    case 'convert': {
      return {
        key,
        args: getDefinedArgs(
          item.data.destinationToken?.symbol ?? item.data.sourceToken?.symbol,
        ),
      };
    }
    case 'bridge':
    case 'wrap':
    case 'unwrap': {
      return {
        key,
        args: getDefinedArgs(item.data.sourceToken?.symbol),
      };
    }
    case 'lendingWithdrawal': {
      return {
        key,
        args: getDefinedArgs(
          item.data.sourceToken?.symbol ?? item.data.destinationToken?.symbol,
        ),
      };
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
      return {
        key,
        args: getDefinedArgs(item.data.token?.symbol),
      };
    }
    case 'swapIncomplete': {
      return {
        key,
        args: getDefinedArgs(item.data.sourceToken?.symbol),
      };
    }
    default:
      return { key, args: [''] };
  }
}

export function Header({ item, onBack }: Props) {
  const t = useI18nContext();
  const titleConfig = getTitleConfig(item);

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
      {titleConfig ? (
        <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
          {t(titleConfig.key, titleConfig.args)}
        </Text>
      ) : null}
    </HeaderBase>
  );
}
