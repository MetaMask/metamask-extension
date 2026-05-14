import React, { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useTheme } from '../../../hooks/useTheme';

import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

import Logo from '../../ui/metafox-logo';

export const MultichainMetaFoxLogo = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const onClick = useCallback(async () => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      margin={2}
      className="multichain-app-header-logo hidden sm:flex"
      data-testid="app-header-logo"
    >
      <Logo unsetIconHeight onClick={onClick} theme={theme} />
    </Box>
  );
};
