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
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type RampsTokenSelectionHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
};

export default function RampsTokenSelectionHeader({
  title,
  subtitle,
  onBack,
}: RampsTokenSelectionHeaderProps) {
  const t = useI18nContext();

  return (
    <Box
      className="relative flex min-h-16 items-center justify-center px-4 py-3"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
    >
      <ButtonBase
        onClick={onBack}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full p-1 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
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
      {subtitle ? (
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {subtitle}
        </Text>
      ) : null}
    </Box>
  );
}
