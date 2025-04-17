// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { getIsRemoteModeEnabled } from '../../../selectors/remote-mode';
import { Button, Box, ButtonSize } from '../../../components/component-library';

import {
  DEFAULT_ROUTE,
  REMOTE_ROUTE_SETUP_SWAPS,
  REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE,
} from '../../../helpers/constants/routes';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import RemoteModeOverview from '../introducing/remote-mode-introducing.component';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import RemoteModeSetup from '../setup/setup-swaps/remote-mode-setup-swaps.component';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import RemoteModePermissions from './remote-mode-permissions.component';

enum RemoteScreen {
  OVERVIEW = 'OVERVIEW',
  PERMISSIONS = 'PERMISSIONS',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SETUP_REMOTE_SWAPS = 'SETUP_REMOTE_SWAPS',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SETUP_DAILY_ALLOWANCE = 'SETUP_DAILY_ALLOWANCE',
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RemoteModeIntroducing() {
  const [currentScreen, setCurrentScreen] = useState<RemoteScreen>(
    RemoteScreen.OVERVIEW,
  );
  const history = useHistory();
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  useEffect(() => {
    if (!isRemoteModeEnabled) {
      history.push(DEFAULT_ROUTE);
    }
  }, [isRemoteModeEnabled, history]);

  const renderScreen = () => {
    switch (currentScreen) {
      case RemoteScreen.OVERVIEW:
        return (
          <Box padding={6}>
            <RemoteModeOverview />
            <Button
              style={{ width: '100%' }}
              onClick={() => setCurrentScreen(RemoteScreen.PERMISSIONS)}
              size={ButtonSize.Lg}
            >
              Continue
            </Button>
          </Box>
        );

      case RemoteScreen.PERMISSIONS:
        return (
          <Box padding={6}>
            <RemoteModePermissions
              setStartEnableRemoteSwap={() => {
                history.push(REMOTE_ROUTE_SETUP_SWAPS);
              }}
              setStartEnableDailyAllowance={() => {
                history.push(REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE);
              }}
            />
          </Box>
        );

      case RemoteScreen.SETUP_REMOTE_SWAPS:
        return (
          <Box padding={2}>
            <RemoteModeSetup />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <div className="main-container" data-testid="remote-mode">
      {renderScreen()}
    </div>
  );
}
