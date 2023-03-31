/*
  TODO:
    * Look at Figma to get the padding of container and spacing between icons
*/
import React, { useContext, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
import {
  AlignItems,
  DISPLAY,
  Size,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  ButtonIcon,
  ICON_NAMES,
  PickerNetwork,
} from '../../component-library';
import { getCurrentNetwork, getSelectedIdentity } from '../../../selectors';
import { GlobalMenu, AccountPicker } from '..';

import Box from '../../ui/box/box';
import { toggleAccountMenu, toggleNetworkMenu } from '../../../store/actions';

export const AppHeader = ({}) => {
  const trackEvent = useContext(MetaMetricsContext);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const menuRef = useRef(false);

  const isUnlocked = useSelector((state) => state.metamask.isUnlocked);

  // Used for account picker
  const identity = useSelector(getSelectedIdentity);
  const dispatch = useDispatch();

  // Used for network icon / dropdown
  const currentNetwork = useSelector(getCurrentNetwork);

  return (
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      style={{ maxWidth: '80vw', width: '100%' }}
      padding={[5, 4, 5, 4]}
      gap={2}
    >
      <Box display={DISPLAY.FLEX}>
        {/* AvatarNetwork should only display in popup mode */}
        <AvatarNetwork
          name={currentNetwork.nickname}
          src={currentNetwork.rpcPrefs?.imageUrl}
          size={Size.MD}
          onClick={() => dispatch(toggleNetworkMenu())}
        />
        {/* PickerNetwork should only display in full screen mode */}
        <PickerNetwork
          label={currentNetwork.nickname}
          src={currentNetwork.rpcPrefs?.imageUrl}
          onClick={() => dispatch(toggleNetworkMenu())}
        />
      </Box>

      {isUnlocked ? (
        <Box style={{ flexGrow: 1, textAlign: 'center' }}>
          <AccountPicker
            address={identity.address}
            name={identity.name}
            onClick={() => dispatch(toggleAccountMenu())}
          />
        </Box>
      ) : null}
      {isUnlocked ? (
        <Box>
          {/*
        Waiting on: https://github.com/MetaMask/metamask-extension/pull/18167

        <MultichainConnectedSiteMenu
          globalMenuColor,
          status,
          text,
        />
      */}
          O
        </Box>
      ) : null}
      {isUnlocked ? (
        <Box ref={menuRef}>
          <ButtonIcon
            iconName={ICON_NAMES.MORE_VERTICAL}
            data-testid="account-options-menu-button"
            ariaLabel="NEEDS NEW TRANSLATED LABEL"
            onClick={() => {
              trackEvent({
                event: EVENT_NAMES.NAV_ACCOUNT_MENU_OPENED,
                category: EVENT.CATEGORIES.NAVIGATION,
                properties: {
                  location: 'Home',
                },
              });
              setAccountOptionsMenuOpen(true);
            }}
          />
        </Box>
      ) : null}
      {accountOptionsMenuOpen ? (
        <GlobalMenu
          anchorElement={menuRef.current}
          closeMenu={() => setAccountOptionsMenuOpen(false)}
        />
      ) : null}
      {isUnlocked ? null : (
        <Box width={8} style={{ textAlign: 'right', flexGrow: '1' }}>
          <img src="/images/logo/metamask-fox.svg" alt="" />
        </Box>
      )}
    </Box>
  );
};
