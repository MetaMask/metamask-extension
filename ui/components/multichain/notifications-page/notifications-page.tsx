import React from 'react';
import { useHistory } from 'react-router-dom';

import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Box } from '../../component-library';
import MetafoxLogo from '../../ui/metafox-logo';
import { Page } from '../pages/page';

export type NotificationsPageProps = {
  children: React.ReactNode;
};

export function NotificationsPage({ children }: NotificationsPageProps) {
  const history = useHistory();

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
        />
      </Box>
      <Page>{children}</Page>
    </div>
  );
}
