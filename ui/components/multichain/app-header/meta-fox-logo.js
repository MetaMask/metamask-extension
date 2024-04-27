import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getTheme,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';

import Logo from '../../ui/metafox-logo';

export const MetaFoxLogo = () => {
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const theme = useSelector((state) => getTheme(state));
  ///: END:ONLY_INCLUDE_IF

  return (
    <Box
      display={[Display.None, Display.Flex]}
      alignItems={AlignItems.center}
      margin={2}
      className="multichain-app-header-logo"
      data-testid="app-header-logo"
      justifyContent={JustifyContent.center}
    >
      <Logo
        unsetIconHeight
        onClick={async () => history.push(DEFAULT_ROUTE)}
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        theme={theme}
        ///: END:ONLY_INCLUDE_IF
      />
    </Box>
  );
};
