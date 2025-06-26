import React from 'react';

import { Box, Button, Text } from '../../components/component-library';
import { Header, Page } from '../../components/multichain/pages/page';
import PredictNavigation from './predict.navigation';

import {
  Display,
  TextVariant,
  BackgroundColor,
} from '../../helpers/constants/design-system';
import PredictMarketsContainer from './markets/predict.markets.container';
import { usePolymarket } from './usePolymarket';

const PredictContainer = () => {
  const { apiKey, createApiKey, deriveApiKey, approveAllowances } =
    usePolymarket();

  return (
    <Page
      className="main-container"
      data-testid="remote-mode"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        marginTop={0}
        marginBottom={0}
        paddingBottom={0}
      >
        <Text variant={TextVariant.headingMd}>Markets</Text>
        <Text variant={TextVariant.bodySm}>Explore the current markets.</Text>
      </Header>
      <Box
        backgroundColor={BackgroundColor.backgroundAlternative}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={4}
      >
        <PredictMarketsContainer />
        <Box
          display={Display.Grid}
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          }}
          gap={2}
        >
          <Button onClick={createApiKey}>Create API Key</Button>
          <Button onClick={deriveApiKey}>Derive API Key</Button>
          <Button onClick={approveAllowances}>Approve Allowances</Button>
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
