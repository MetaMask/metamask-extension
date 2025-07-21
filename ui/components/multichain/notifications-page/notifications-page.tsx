import React from 'react';
import { useHistory } from 'react-router-dom';
import { Box } from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import MetafoxLogo from '../../ui/metafox-logo';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

import { Page } from '../pages/page';

export type NotificationsPageProps = {
  children: React.ReactNode;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
