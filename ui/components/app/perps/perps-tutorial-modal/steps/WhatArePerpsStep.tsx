import React from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../../shared/constants/app';

const WhatArePerpsStep: React.FC = () => {
  const t = useI18nContext();
  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  return (
    <Box
      className="flex-1 flex flex-col items-center px-6 pt-4 pb-2"
      data-testid="perps-tutorial-what-are-perps"
    >
      <Text variant={TextVariant.HeadingLg} className="text-left mb-2 w-full">
        {t('perpsTutorialWhatArePerpsTitle')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-left text-alternative w-full"
      >
        {t('perpsTutorialWhatArePerpsDescription')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        className="text-left text-alternative w-full mt-2"
      >
        {t('perpsTutorialWhatArePerpsSubtitle')}
      </Text>

      <Box
        data-testid="perps-tutorial-step-image"
        style={{
          height: isPopup ? 180 : 280,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src="./images/perps-character.png"
          alt=""
          style={{
            width: isPopup ? 180 : 280,
            height: isPopup ? 180 : 280,
            objectFit: 'contain',
          }}
        />
      </Box>
    </Box>
  );
};

export default WhatArePerpsStep;
