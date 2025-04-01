import React, { useState } from 'react';
import { Button, Box } from '../../../components/component-library';

import RemoteModeOverview from '../introducing/remote-mode-overview.component';
import RemoteModePermissions from '../introducing/remote-mode-permissions.component';
import RemoteModeSetup from '../setup/remote-mode-setup.component';

enum RemoteScreen {
  OVERVIEW = 'OVERVIEW',
  PERMISSIONS = 'PERMISSIONS',
  SETUP = 'SETUP'
}

export default function RemoteModeIntroducing() {
  const [currentScreen, setCurrentScreen] = useState<RemoteScreen>(RemoteScreen.OVERVIEW);

  const renderScreen = () => {
    switch (currentScreen) {
      case RemoteScreen.OVERVIEW:
        return (
          <Box padding={6}>
            <RemoteModeOverview />
            <Button
              style={{ width: '100%' }}
              onClick={() => setCurrentScreen(RemoteScreen.PERMISSIONS)}
            >
              Continue
            </Button>
          </Box>
        );

      case RemoteScreen.PERMISSIONS:
        return (
          <Box padding={6}>
            <RemoteModePermissions
              setStartEnableRemoteSwap={() => setCurrentScreen(RemoteScreen.SETUP)}
            />
          </Box>
        );

      case RemoteScreen.SETUP:
        return (
          <Box padding={2}>
            <RemoteModeSetup accounts={[]} />
          </Box>
        );

      default:
        return null;
    }
  };

  return <>{renderScreen()}</>;
}
