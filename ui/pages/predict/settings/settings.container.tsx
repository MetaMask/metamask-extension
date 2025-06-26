import React from 'react';

import { Box, Button, Text } from '../../../components/component-library';
import { Header, Page } from '../../../components/multichain/pages/page';
import {
  BackgroundColor,
  Display,
  TextVariant,
} from '../../../helpers/constants/design-system';

import { usePolymarket } from '../usePolymarket';
import PredictNavigation from '../predict.navigation';

const PredictContainer = () => {
  const { apiKey, createApiKey, deriveApiKey, approveAllowances } =
    usePolymarket();

  return (
    <Page
      className="main-container"
      data-testid="predict-settings"
      backgroundColor={BackgroundColor.backgroundAlternative}
    >
      <PredictNavigation />
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        marginTop={0}
        marginBottom={0}
        paddingBottom={0}
      >
        <Text variant={TextVariant.headingMd}>Settings</Text>
      </Header>
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
    </Page>
  );
};

export default PredictContainer;
