import React from 'react';

import { Box, Button, Text } from '../../components/component-library';
import PredictMarketsContainer from './markets/predict.markets.container';
import { Header, Page } from '../../components/multichain/pages/page';

import {
  Display,
  FlexDirection,
  TextVariant,
  BackgroundColor,
} from '../../helpers/constants/design-system';
import { usePolymarket } from './usePolymarket';

const PredictContainer = () => {
  const {
    apiKey,
    createApiKey,
    deriveApiKey,
    approveToken,
    approveNegRiskToken,
    approveNegRiskAdapterToken,
    approveConditionalToken,
  } = usePolymarket();

  return (
    <Page className="main-container" data-testid="remote-mode" backgroundColor={BackgroundColor.backgroundAlternative}>
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
      >
        Predictive markets
      </Header>
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <PredictMarketsContainer />
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={2}>
          <Button onClick={createApiKey}>Create API Key</Button>
          <Button onClick={deriveApiKey}>Derive API Key</Button>
          <Button onClick={approveToken}>Approve Token</Button>
          <Button onClick={approveNegRiskToken}>Approve Neg Risk Token</Button>
          <Button onClick={approveNegRiskAdapterToken}>
            Approve Neg Risk Adapter Token
          </Button>
          <Button onClick={approveConditionalToken}>
            Approve Conditional Token
          </Button>
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
