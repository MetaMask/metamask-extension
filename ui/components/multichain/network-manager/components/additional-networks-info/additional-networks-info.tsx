import React, { memo } from 'react';
import {
  AlignItems,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Box } from '../../../../component-library/box';
import { Text } from '../../../../component-library/text';

/**
 * AdditionalNetworksInfo Component
 *
 * Displays the "Additional networks" section label in the network manager.
 */
export const AdditionalNetworksInfo = memo(() => {
  const t = useI18nContext();

  return (
    <Box paddingTop={4} paddingBottom={4} paddingRight={4} paddingLeft={4}>
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        {/* Container for the "Additional Networks" text */}
        <Box display={Display.Flex} alignItems={AlignItems.center}>
          {/* Label text - uses translation key "additionalNetworks" */}
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            {t('additionalNetworks')}
          </Text>
        </Box>
      </Box>
    </Box>
  );
});
