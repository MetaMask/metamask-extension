import React, { useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  Checkbox,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { HardwareAccountAddressRow } from '../hardware-account-address-row';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { HardwareAccountCardProps } from './hardware-account-card.types';

/**
 * Account card for hardware wallet onboarding with selection and address rows.
 * @param options0
 * @param options0.account
 * @param options0.isSelected
 * @param options0.onToggleSelection
 */
export const HardwareAccountCard = ({
  account,
  isSelected,
  onToggleSelection,
}: HardwareAccountCardProps) => {
  const t = useI18nContext();
  const isDisabled = Boolean(account.isAlreadyConnected);

  const handleToggleSelection = useCallback(() => {
    if (isDisabled) {
      return;
    }
    onToggleSelection(account.id);
  }, [account.id, isDisabled, onToggleSelection]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={3}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      borderColor={BoxBorderColor.BorderMuted}
      borderWidth={isSelected ? 1 : 0}
      className="w-full rounded-xl"
      data-testid="hardware-account-card"
      data-selected={isSelected}
      title={
        isDisabled
          ? (t('selectAnAccountAlreadyConnected') as string)
          : undefined
      }
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="w-full"
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          className={`min-w-0 flex-1 ${isDisabled ? '' : 'cursor-pointer'}`}
          data-testid="hardware-account-card-header"
          onClick={isDisabled ? undefined : handleToggleSelection}
          onKeyDown={
            isDisabled
              ? undefined
              : (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleToggleSelection();
                  }
                }
          }
          role={isDisabled ? undefined : 'button'}
          tabIndex={isDisabled ? undefined : 0}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {account.name}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
            data-testid="hardware-account-card-total-balance"
          >
            {account.totalBalance}
          </Text>
        </Box>
        <Checkbox
          id={`hardware-account-${account.id}`}
          isSelected={isSelected || isDisabled}
          isDisabled={isDisabled}
          onChange={handleToggleSelection}
          aria-label={account.name}
        />
      </Box>
      <Box className="h-px w-full bg-border-muted" />
      <Box flexDirection={BoxFlexDirection.Column} gap={2} className="w-full">
        {account.addresses.map((address) => (
          <HardwareAccountAddressRow key={address.id} address={address} />
        ))}
      </Box>
    </Box>
  );
};
