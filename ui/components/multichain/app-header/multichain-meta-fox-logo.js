import React, { useCallback } from 'react';

import { useHistory } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useTheme } from '../../../hooks/useTheme';

import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';

import Logo from '../../ui/metafox-logo';

export const MultichainMetaFoxLogo = () => {
  const history = useHistory();
  const theme = useTheme();

  const onClick = useCallback(async () => {
    history.push(DEFAULT_ROUTE);
  }, [history]);

  return (
    <Box
      display={[Display.None, Display.Flex]}
      alignItems={AlignItems.center}
      margin={2}
      className="multichain-app-header-logo"
      data-testid="app-header-logo"
      justifyContent={JustifyContent.center}
    >
      <Logo unsetIconHeight onClick={onClick} theme={theme} />
    </Box>
  );
};
