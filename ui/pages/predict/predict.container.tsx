import React from 'react';

import { Box, Text } from '../../components/component-library';
import { Header, Page } from '../../components/multichain/pages/page';
import {
  BackgroundColor,
  TextVariant,
} from '../../helpers/constants/design-system';

import PredictMarketsContainer from './markets/predict.markets.container';

const PredictContainer = () => {
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
