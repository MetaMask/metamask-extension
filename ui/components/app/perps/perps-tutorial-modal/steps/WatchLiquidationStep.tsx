import React from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import PerpsTutorialAnimation from '../PerpsTutorialAnimation';

const WatchLiquidationStep: React.FC = () => {
  const t = useI18nContext();

  return (
    <Box
      className="flex-1 flex flex-col items-center px-6 pt-4 pb-2"
      data-testid="perps-tutorial-watch-liquidation"
    >
      <Text variant={TextVariant.HeadingLg} className="text-left mb-2 w-full">
        {t('perpsTutorialWatchLiquidationTitle')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-left text-alternative w-full"
      >
        {t('perpsTutorialWatchLiquidationDescription')}
      </Text>
      <Box
        className="flex-1 flex items-center justify-center w-full"
        data-testid="perps-tutorial-step-image"
      >
        <PerpsTutorialAnimation artboardName="03_Liquidation" />
      </Box>
    </Box>
  );
};

export default WatchLiquidationStep;
