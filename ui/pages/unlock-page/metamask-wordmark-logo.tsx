import React from 'react';
import { useTheme } from '../../hooks/useTheme';

import MetaFoxHorizontalLogo from '../../components/ui/metafox-logo/horizontal-logo';

export const MetamaskWordmarkLogo = (isPopup: boolean) => {
  const theme = useTheme();

  return (
    <MetaFoxHorizontalLogo
      theme={theme}
      className={`unlock-page__mascot-container__horizontal-logo ${isPopup ? 'unlock-page__mascot-container__horizontal-logo--popup' : ''}`}
    />
  );
};
