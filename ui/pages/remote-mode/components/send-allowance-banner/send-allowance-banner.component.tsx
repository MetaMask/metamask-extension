import React from 'react';
import { useHistory } from 'react-router-dom';

import {
  BackgroundColor,
  Display,
  TextColor,
  TextVariant,
  BlockSize,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import Card from '../../../../components/ui/card';
import { Box, Text } from '../../../../components/component-library';
import { REMOTE_ROUTE } from '../../../../helpers/constants/routes';

export default function SendAllowanceBanner() {
  const history = useHistory();

  const remoteMode = localStorage.getItem('remoteMode');
  const remoteModeAllowance = remoteMode ? JSON.parse(remoteMode) : null;

  return (
    <Card
      backgroundColor={BackgroundColor.backgroundAlternativeSoft}
      marginBottom={3}
    >
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
      >
        <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
          Send {remoteModeAllowance?.dailyAllowance?.allowances[0]?.amount || 0}{' '}
          ETH without connecting hardware wallet.
        </Text>
        <Text
          color={TextColor.infoDefault}
          variant={TextVariant.bodyMd}
          onClick={() => history.push(REMOTE_ROUTE)}
          style={{ cursor: 'pointer' }}
        >
          View permissions
        </Text>
      </Box>
    </Card>
  );
}
