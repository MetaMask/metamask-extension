import React from 'react';
import {
  Box,
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export function RampsProviderSeparator() {
  const t = useI18nContext();

  return (
    <Box className="px-4 py-3" data-testid="ramps-provider-separator">
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        fontWeight={FontWeight.Medium}
      >
        {t('rampsOtherOptions')}
      </Text>
    </Box>
  );
}
