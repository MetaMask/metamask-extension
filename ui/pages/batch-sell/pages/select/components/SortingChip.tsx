import {
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type SortingChipProps = {
  order: 'asc' | 'desc';
  onClick: (newOrder: 'asc' | 'desc') => void;
};

export const SortingChip = ({ order, onClick }: SortingChipProps) => {
  const t = useI18nContext();

  return (
    <ButtonBase
      className="flex flex-row items-center gap-1 bg-inherit"
      onClick={() => onClick(order === 'asc' ? 'desc' : 'asc')}
    >
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
      >
        {t('balance')}
      </Text>
      <Icon
        size={IconSize.Sm}
        name={order === 'desc' ? IconName.Arrow2Down : IconName.Arrow2Up}
        color={IconColor.IconAlternative}
      />
    </ButtonBase>
  );
};
