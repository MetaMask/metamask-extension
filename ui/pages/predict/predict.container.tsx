import React from 'react';

import { Box, Button, Text } from '../../components/component-library';

import { Header, Page } from '../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import { usePolymarket } from './usePolymarket';

const PredictContainer = () => {
  const { apiKey, createApiKey, deriveApiKey, approveToken } = usePolymarket();

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
      >
        Predict
      </Header>
      <Box>
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={2}>
          <Button onClick={createApiKey}>Create API Key</Button>
          <Button onClick={deriveApiKey}>Derive API Key</Button>
          <Button onClick={approveToken}>Approve Token</Button>
        </Box>
        {apiKey && (
          <>
            <Text>API Key: {apiKey?.key}</Text>
            <Text>Secret: {apiKey?.secret}</Text>
            <Text>Passphrase: {apiKey?.passphrase}</Text>
          </>
        )}
      </Box>
    </Page>
  );
};

export default PredictContainer;
