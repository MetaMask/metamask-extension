import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { getIsRemoteModeEnabled } from '../../../selectors/remote-mode';
import { Button, ButtonIcon, ButtonSize, ButtonIconSize, IconName } from '../../../components/component-library';
import {
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';

import {
  DEFAULT_ROUTE,
  REMOTE_ROUTE_SETUP_SWAPS,
  REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE,
} from '../../../helpers/constants/routes';

import RemoteModeOverview from '../introducing/remote-mode-introducing.component';
import RemoteModeSetup from '../setup/setup-swaps/remote-mode-setup-swaps.component';
import RemoteModePermissions from './remote-mode-permissions.component';

enum RemoteScreen {
  OVERVIEW = 'OVERVIEW',
  PERMISSIONS = 'PERMISSIONS',
  SETUP_REMOTE_SWAPS = 'SETUP_REMOTE_SWAPS',
  SETUP_DAILY_ALLOWANCE = 'SETUP_DAILY_ALLOWANCE',
}

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
          <Content padding={6}>
            <RemoteModeOverview />
            <Button
              style={{ width: '100%' }}
              onClick={() => setCurrentScreen(RemoteScreen.PERMISSIONS)}
              size={ButtonSize.Lg}
            >
              Get Remote Mode
            </Button>
          </Content>
        );

      case RemoteScreen.PERMISSIONS:
        return (
          <Content padding={6}>
            <RemoteModePermissions
              setStartEnableRemoteSwap={() => {
                history.push(REMOTE_ROUTE_SETUP_SWAPS);
              }}
              setStartEnableDailyAllowance={() => {
                history.push(REMOTE_ROUTE_SETUP_DAILY_ALLOWANCE);
              }}
            />
          </Content>
        );

      case RemoteScreen.SETUP_REMOTE_SWAPS:
        return (
          <Content padding={2}>
            <RemoteModeSetup />
          </Content>
        );

      default:
        return null;
    }
  };

  const onCancel = () => {
    history.push(DEFAULT_ROUTE);
  };

  return (
    <Page className="main-container" data-testid="remote-mode">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={'back'}
            iconName={IconName.ArrowLeft}
            onClick={onCancel}
          />
        }
      >
        Remote mode
      </Header>
      {renderScreen()}
    </Page>
  );
}
