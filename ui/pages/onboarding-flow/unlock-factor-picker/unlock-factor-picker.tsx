import React from 'react';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { SecretEscrowFactorOption } from '../../../../shared/constants/secret-escrow-factors';
import { getPasskeyAuthMethodKey } from '../../../../shared/lib/passkey';

export type UnlockFactorPickerProps = {
  options: readonly SecretEscrowFactorOption[];
  onSelect: (option: SecretEscrowFactorOption) => void;
  onBack: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Extensible unlock-factor chooser for social-login onboarding.
 *
 * Options come from {@link SECRET_ESCROW_FACTOR_OPTIONS} so new factors
 * (e.g. TOTP) can be added without rewriting this UI.
 *
 * @param props - Component props.
 * @param props.options - Available factor presets.
 * @param props.onSelect - Called when the user picks a preset.
 * @param props.onBack - Back navigation handler.
 */
export default function UnlockFactorPicker({
  options,
  onSelect,
  onBack,
}: UnlockFactorPickerProps) {
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());

  const substitutePasskeyLabel = (key: string): string =>
    t(key, [passkeyMethodLabel]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="h-full w-full"
      data-testid="unlock-factor-picker"
      padding={4}
    >
      <Box>
        <Box className="mb-4 w-full">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            data-testid="unlock-factor-picker-back-button"
            type="button"
            onClick={onBack}
            ariaLabel={t('back')}
          />
        </Box>
        <Text variant={TextVariant.HeadingLg} className="mb-2">
          {t('secretEscrowFactorPickerTitle')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('secretEscrowFactorPickerDescription')}
        </Text>
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} gap={3} className="w-full">
        {options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full h-auto py-4"
            data-testid={`unlock-factor-option-${option.id}`}
            onClick={() => onSelect(option)}
          >
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Start}
              className="w-full text-left"
              gap={1}
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
              >
                {substitutePasskeyLabel(option.titleKey)}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {substitutePasskeyLabel(option.descriptionKey)}
              </Text>
            </Box>
          </Button>
        ))}
      </Box>
    </Box>
  );
}
