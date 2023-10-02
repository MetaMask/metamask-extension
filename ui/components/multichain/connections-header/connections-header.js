import React, { useRef } from 'react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Box, Text } from '../../component-library';

export const ConnectionsHeader = () => {
  const t = useI18nContext();
  const menuRef = useRef(false);
  return (
    <Box
      className="connections-header"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
    >
      <Text>{t('connections')}</Text>
      <Box
        ref={menuRef}
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        width={BlockSize.Full}
      ></Box>
    </Box>
  );
};
