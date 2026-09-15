import React from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useTheme } from '../../../hooks/useTheme';
import Logo from '../../ui/metafox-logo';

export const MultichainMetaFoxLogo = () => {
  const theme = useTheme();

  return (
    <Link to={DEFAULT_ROUTE} className="py-4">
      <Logo unsetIconHeight theme={theme} />
    </Link>
  );
};
