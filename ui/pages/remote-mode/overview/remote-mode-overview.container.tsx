import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { getSelectedInternalAccount } from '../../../selectors';
import { getIsRemoteModeEnabled } from '../../../selectors/remote-mode';
import { isRemoteModeSupported } from '../../../helpers/utils/remote-mode';

import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';
import {
  Content,
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
  const [isHardwareAccount, setIsHardwareAccount] = useState<boolean>(false);

  const selectedHardwareAccount = useSelector(getSelectedInternalAccount);
  const history = useHistory();
  const isRemoteModeEnabled = useSelector(getIsRemoteModeEnabled);

  useEffect(() => {
    setIsHardwareAccount(isRemoteModeSupported(selectedHardwareAccount));
  }, [selectedHardwareAccount]);

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
              disabled={!isHardwareAccount}
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
      {!isHardwareAccount && (
        <Box padding={4}>
          <BannerAlert severity={BannerAlertSeverity.Warning} marginBottom={2}>
            <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold}>
              Select a hardware wallet
            </Text>
            <Text variant={TextVariant.bodyMd}>
              To continue, select your hardware wallet from the account menu.
            </Text>
          </BannerAlert>
        </Box>
      )}
      {renderScreen()}
    </Page>
  );
}
