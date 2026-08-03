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
  Icon,
  IconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  SecretEscrowFactorKind,
  SecretEscrowFactorOption,
} from '../../../../shared/constants/secret-escrow-factors';
import { getSecretEscrowFactorTitleKey } from '../../../../shared/constants/secret-escrow-factors';
import { getPasskeyAuthMethodKey } from '../../../../shared/lib/passkey';

export type UnlockFactorPickerProps = {
  /** When true, show enrolled factors + addable options + continue. */
  manageMode?: boolean;
  options: readonly SecretEscrowFactorOption[];
  enrolledFactors?: readonly SecretEscrowFactorKind[];
  onSelect: (option: SecretEscrowFactorOption) => void;
  onContinue?: () => void;
  onBack: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Extensible unlock-factor chooser / manager for social-login onboarding.
 *
 * First visit: pick one factor. After setup: manage enrolled factors and
 * optionally add more. Options come from {@link SECRET_ESCROW_FACTOR_OPTIONS}.
 *
 * @param props - Component props.
 * @param props.manageMode
 * @param props.options
 * @param props.enrolledFactors
 * @param props.onSelect
 * @param props.onContinue
 * @param props.onBack
 */
export default function UnlockFactorPicker({
  manageMode = false,
  options,
  enrolledFactors = [],
  onSelect,
  onContinue,
  onBack,
}: UnlockFactorPickerProps) {
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());

  const substitutePasskeyLabel = (key: string): string =>
    t(key, [passkeyMethodLabel]);

  const title = manageMode
    ? t('secretEscrowFactorManageTitle')
    : t('secretEscrowFactorPickerTitle');
  const description = manageMode
    ? t('secretEscrowFactorManageDescription')
    : t('secretEscrowFactorPickerDescription');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="h-full w-full"
      data-testid={
        manageMode ? 'unlock-factor-manager' : 'unlock-factor-picker'
      }
      padding={4}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={4} className="w-full">
        <Box className="w-full">
          {!manageMode && (
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
          )}
          <Text variant={TextVariant.HeadingLg} className="mb-2">
            {title}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {description}
          </Text>
        </Box>

        {manageMode && enrolledFactors.length > 0 && (
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={2}
            className="w-full"
            data-testid="unlock-factor-enrolled-list"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
            >
              {t('secretEscrowFactorEnrolledHeading')}
            </Text>
            {enrolledFactors.map((factor) => (
              <Box
                key={factor}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={2}
                className="w-full py-2"
                data-testid={`unlock-factor-enrolled-${factor}`}
              >
                <Icon
                  name={IconName.Check}
                  size={IconSize.Md}
                  color={IconColor.IconSuccess}
                />
                <Text variant={TextVariant.BodyMd}>
                  {substitutePasskeyLabel(
                    getSecretEscrowFactorTitleKey(factor),
                  )}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        {options.length > 0 && (
          <Box flexDirection={BoxFlexDirection.Column} gap={3} className="w-full">
            {manageMode && (
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
              >
                {t('secretEscrowFactorAddHeading')}
              </Text>
            )}
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
        )}
      </Box>

      {manageMode && onContinue && (
        <Button
          type="button"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="unlock-factor-continue-button"
          onClick={onContinue}
        >
          {t('continue')}
        </Button>
      )}
    </Box>
  );
}
