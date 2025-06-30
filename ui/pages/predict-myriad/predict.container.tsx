import React, { useEffect, useState } from 'react';

import { Box, Button, Text } from '../../components/component-library';
import { Header, Page } from '../../components/multichain/pages/page';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../helpers/constants/design-system';

import PredictMarketsContainer from './markets/predict.markets.container';
import { usePolymarket } from './usePolymarket';
import { useMyriad } from './useMyriad';

const PredictContainer = () => {
  const { apiKey, createApiKey, approveAllowances } = usePolymarket();
  const { polymarketsClient } = useMyriad();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnablePredict = async () => {
    setIsLoading(true);
    await createApiKey();
    await approveAllowances();
    setIsLoading(false);
  };

  const getAddress = async () => {
    const userAddress = await polymarketsClient.getAddress();
    console.log('userAddress', userAddress);
  };

  useEffect(() => {
    getAddress();
  }, [polymarketsClient]);

  if (!apiKey) {
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
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.headingMd}>
            Enable Predict to start trading
          </Text>
          <Button onClick={handleEnablePredict} loading={isLoading}>
            Enable Predict
          </Button>
        </Box>
      </Page>
    );
  }

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
      </Box>
    </Page>
  );
};

export default PredictContainer;
