import React from 'react';

import { Box, Text } from '../../../components/component-library';

import { Page } from '../../../components/multichain/pages/page';
import {
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import PredictNavigation from '../predict.navigation';

const PredictContainer = () => {
  return (
    <Page className="main-container" data-testid="remote-mode">
      <Box backgroundColor={BackgroundColor.backgroundAlternative} padding={4}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          textAlign={TextAlign.Center}
        >
          <Text variant={TextVariant.headingMd}>Profit and Loss</Text>
          <Text variant={TextVariant.bodySm}>
            Track your profit and loss for your predictions.
          </Text>
        </Box>
        <PredictNavigation />
        <Box>
          <Text>Coming soon ™️</Text>
        </Box>
      </Box>
    </Page>
  );
};

export default PredictContainer;
