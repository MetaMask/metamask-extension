import React, { useState } from 'react';
import { Button } from '../../../components/component-library';

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
          <>
            <RemoteModeOverview />
            <Button
              style={{ width: '100%' }}
              onClick={() => setCurrentScreen(RemoteScreen.PERMISSIONS)}
            >
              Continue
            </Button>
          </>
        );

      case RemoteScreen.PERMISSIONS:
        return (
          <RemoteModePermissions
            setStartEnableRemoteSwap={() => setCurrentScreen(RemoteScreen.SETUP)}
          />
        );

      case RemoteScreen.SETUP:
        return <RemoteModeSetup accounts={[]} />;

      default:
        return null;
    }
  };

  return <>{renderScreen()}</>;
}
