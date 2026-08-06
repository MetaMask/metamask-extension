import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type RampsChangeProviderFooterProps = {
  providerName: string;
  isDisabled?: boolean;
  onChangeProvider: () => void;
};

/**
 * Footer entrypoint on the payment method page to open provider selection.
 *
 * @param options0
 * @param options0.providerName
 * @param options0.isDisabled
 * @param options0.onChangeProvider
 */
export default function RampsChangeProviderFooter({
  providerName,
  isDisabled = false,
  onChangeProvider,
}: RampsChangeProviderFooterProps) {
  const t = useI18nContext();

  return (
    <Box
      className="border-t border-border-muted px-4 py-3"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      gap={1}
      data-testid="ramps-change-provider-footer"
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {t('rampsBuyingViaProvider', [providerName])}
      </Text>
      {isDisabled ? (
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('rampsChangeProvider')}
        </Text>
      ) : (
        <TextButton
          size={TextButtonSize.BodyMd}
          onClick={onChangeProvider}
          data-testid="ramps-change-provider-button"
        >
          {t('rampsChangeProvider')}
        </TextButton>
      )}
    </Box>
  );
}
