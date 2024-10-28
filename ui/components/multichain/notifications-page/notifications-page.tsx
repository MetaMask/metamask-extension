import React from 'react';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useSelector } from 'react-redux';
///: END:ONLY_INCLUDE_IF
import { useHistory } from 'react-router-dom';
import { Box } from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import MetafoxLogo from '../../ui/metafox-logo';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getTheme,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

import { Page } from '../pages/page';

export type NotificationsPageProps = {
  children: React.ReactNode;
};

export function NotificationsPage({ children }: NotificationsPageProps) {
  const history = useHistory();

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const theme = useSelector((state) => getTheme(state));
  ///: END:ONLY_INCLUDE_IF

  return (
    <div className="main-container" data-testid="notifications-page">
      <Box
        display={[Display.None, Display.Flex]}
        alignItems={AlignItems.center}
        margin={2}
        className="multichain-app-header-logo"
        data-testid="app-header-logo"
        justifyContent={JustifyContent.center}
      >
        <MetafoxLogo
          unsetIconHeight
          onClick={() => history.push(DEFAULT_ROUTE)}
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          theme={theme}
          ///: END:ONLY_INCLUDE_IF
        />
      </Box>
      <Page>{children}</Page>
    </div>
  );
}
