import React from 'react';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { Box, PickerNetwork } from '../../component-library';
import MetafoxLogo from '../../ui/metafox-logo';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getTestNetworkBackgroundColor } from '../../../selectors';
import { useSelector } from 'react-redux';

type Network = {
  chainId: string;
  nickname?: string;
  rpcUrl: string;
  providerType: string;
  ticker: string;
  id: string;
  removable: boolean;
  rpcPrefs?: {
    imageUrl: string;
  };
};

export const LockedHeader = ({
  currentNetwork,
  popupStatus,
  networkOpenCallback,
}: {
  currentNetwork: Network;
  popupStatus: boolean;
  networkOpenCallback: () => void;
}) => {
  const t = useI18nContext();
  const history = useHistory();
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  return (
    <Box
      display={Display.Flex}
      className={classnames('multichain-app-header__lock-contents')}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      justifyContent={JustifyContent.spaceBetween}
      backgroundColor={BackgroundColor.backgroundDefault}
      padding={2}
      gap={2}
    >
      <div>
        <PickerNetwork
          avatarNetworkProps={{
            backgroundColor: testNetworkBackgroundColor,
            role: 'img',
          }}
          aria-label={`${t('networkMenu')} ${currentNetwork?.nickname}`}
          label={currentNetwork?.nickname || ''}
          src={currentNetwork?.rpcPrefs?.imageUrl}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            networkOpenCallback();
          }}
          className="multichain-app-header__contents__network-picker"
          data-testid="network-display"
        />
      </div>
      <MetafoxLogo
        unsetIconHeight
        onClick={async () => {
          history.push(DEFAULT_ROUTE);
        }}
      />
    </Box>
  );
};
