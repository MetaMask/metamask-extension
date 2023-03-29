/*
  TODO:
    * Look at Figma to get the padding of container and spacing between icons
    * Put this new header in place with feature flag
*/

import React, { useContext, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
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
import { GlobalMenu } from '../global-menu';

import Box from '../../ui/box/box';
import { getSelectedIdentity } from '../../../selectors';

export const AppHeader = ({}) => {
  const trackEvent = useContext(MetaMetricsContext);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const menuRef = useRef(false);

  // Used for account picker
  const identity = useSelector(getSelectedIdentity);

  // Used for network icon / dropdown
  const currentNetwork = useSelector((state) => ({
    nickname: state.metamask.provider.nickname,
    type: state.metamask.provider.type,
  }));

  return (
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      style={{ background: 'red' }}
      padding={[5, 4, 5, 4]}
      gap={2}
    >
      {/* AvatarNetwork should only display in popup mode */}
      <AvatarNetwork
        name="TODO"
        src="TODO"
        size={Size.MD}
        style={{ background: 'pink' }}
      />
      {/* PickerNetwork should only display in full screen mode */}
      <PickerNetwork className avatarNetworkProps iconProps label src />
      <Box style={{ flexGrow: 1, background: 'lightyellow' }}>
        {/*
        Waiting on: https://github.com/MetaMask/metamask-extension/pull/18177

        <AccountPicker address={} name={} onClick={() => undefined} />
      */}
        (Account picker here)
      </Box>
      <Box style={{ background: 'lightblue' }}>
        {/*
        Waiting on: https://github.com/MetaMask/metamask-extension/pull/18167

        <MultichainConnectedSiteMenu
          className,
          globalMenuColor,
          status,
          text,
        />
      */}
        O
      </Box>
      <ButtonIcon
        iconName={ICON_NAMES.MORE_VERTICAL}
        data-testid="account-options-menu-button"
        ariaLabel="NEEDS NEW TRANSLATED LABEL"
        style={{ background: 'lightgreen' }}
        ref={menuRef}
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
      {accountOptionsMenuOpen ? (
        <GlobalMenu
          anchorElement={menuRef.current}
          closeMenu={() => setAccountOptionsMenuOpen(false)}
        />
      ) : null}
    </Box>
  );
};
