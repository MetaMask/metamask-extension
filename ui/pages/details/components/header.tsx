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

function getTitle(
  item: ActivityListItem | undefined,
  t: ReturnType<typeof useI18nContext>,
) {
  if (!item) {
    return undefined;
  }

  switch (item.type) {
    case 'send':
    case 'receive': {
      const action = item.type === 'receive' ? t('received') : t('sent');
      return item.data.token?.symbol
        ? `${action} ${item.data.token.symbol}`
        : item.type;
    }
    case 'swap':
    case 'convert':
    case 'lendingDeposit':
    case 'lendingWithdrawal':
    case 'wrap':
    case 'unwrap':
    case 'bridge': {
      const sourceSymbol = item.data.sourceToken?.symbol;
      const destinationSymbol = item.data.destinationToken?.symbol;

      return sourceSymbol && destinationSymbol
        ? `${t('bridgeTxDetailsSwapped')} ${sourceSymbol} ${t('to').toLowerCase()} ${destinationSymbol}`
        : item.type;
    }
    default:
      return item.type;
  }
}

export function Header({ item, onBack }: Props) {
  const t = useI18nContext();

  return (
    <Box className="grid grid-cols-[40px_1fr_40px] items-center pb-8">
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Sm}
        onClick={onBack}
      />
      {getTitle(item, t) ? (
        <Text className="text-center font-medium">{getTitle(item, t)}</Text>
      ) : null}
    </Box>
  );
}
