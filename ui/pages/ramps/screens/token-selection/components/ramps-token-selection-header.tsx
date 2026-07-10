import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type RampsTokenSelectionHeaderProps = {
  title: string;
  onBack: () => void;
};

export default function RampsTokenSelectionHeader({
  title,
  onBack,
}: RampsTokenSelectionHeaderProps) {
  const t = useI18nContext();

  return (
    <Box
      className="border-b border-border-muted px-4 py-3"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
    >
      <ButtonBase
        onClick={onBack}
        className="rounded-full p-1 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
        data-testid="ramps-token-selection-back"
        aria-label={t('back')}
      >
        <Icon
          name={IconName.ArrowLeft}
          size={IconSize.Md}
          color={IconColor.IconDefault}
        />
      </ButtonBase>
      <Text fontWeight={FontWeight.Medium}>{title}</Text>
    </Box>
  );
}
