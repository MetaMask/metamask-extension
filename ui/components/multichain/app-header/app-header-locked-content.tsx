import React from 'react';
import { useHistory } from 'react-router-dom';
import MetafoxLogo from '../../ui/metafox-logo';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

export const AppHeaderLockedContent = () => {
  const history = useHistory();
  return (
    <>
      <div></div>
      <MetafoxLogo
        unsetIconHeight
        onClick={async () => {
          history.push(DEFAULT_ROUTE);
        }}
      />
    </>
  );
};
