import React from 'react';

import { Box, Button, Text } from '../../../components/component-library';
import { Page } from '../../../components/multichain/pages/page';
import {
  BackgroundColor,
  Display,
  TextVariant,
  FlexDirection,
  JustifyContent,
  TextAlign,
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
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        padding={4}
        backgroundColor={BackgroundColor.backgroundAlternative}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
        >
          <Text variant={TextVariant.headingMd}>Settings</Text>
          <Text variant={TextVariant.bodySm}>Manage MetaMask Predict.</Text>
        </Box>
        <PredictNavigation />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.center}
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
