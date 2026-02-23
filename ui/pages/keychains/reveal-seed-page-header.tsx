import React from 'react';
import { ButtonIcon, IconName, IconColor, ButtonIconSize, Text, TextVariant, TextColor, Box, BoxAlignItems, BoxJustifyContent, BoxFlexDirection } from '@metamask/design-system-react';

interface RevealSeedPageHeaderProps {
  onBack: () => void;
  title: string;
  backButtonAriaLabel: string;
}

export function RevealSeedPageHeader({
  onBack,
  title,
  backButtonAriaLabel,
}: RevealSeedPageHeaderProps) {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      gap={2}
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        color={IconColor.IconDefault}
        size={ButtonIconSize.Md}
        data-testid="reveal-recovery-phrase-back-button"
        onClick={onBack}
        ariaLabel={backButtonAriaLabel}
      />
      <Text variant={TextVariant.HeadingSm} color={TextColor.TextDefault}>
        {title}
      </Text>
      <Box />
    </Box>
  );
}
