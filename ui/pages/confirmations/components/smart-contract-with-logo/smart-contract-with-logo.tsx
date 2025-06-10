import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function SmartContractWithLogo() {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.backgroundAlternative}
      style={{
        padding: '1px 8px 1px 4px',
      }}
    >
      <img src="images/logo/metamask-fox.svg" width="16" height="16" />
      <Text marginLeft={2} color={TextColor.inherit}>
        {t('interactWithSmartContract')}
      </Text>
    </Box>
  );
}

export default SmartContractWithLogo;
