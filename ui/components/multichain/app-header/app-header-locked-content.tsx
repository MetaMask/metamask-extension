import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import MetafoxLogo from '../../ui/metafox-logo';
import { PickerNetwork } from '../../component-library';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getTestNetworkBackgroundColor } from '../../../selectors';
import { getNetworkIcon } from '../../../../shared/modules/network.utils';

type AppHeaderLockedContentProps = {
  currentNetwork: MultichainNetworkConfiguration;
  networkOpenCallback: () => void;
};

export const AppHeaderLockedContent = ({
  currentNetwork,
  networkOpenCallback,
}: AppHeaderLockedContentProps) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const history = useHistory();

  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);
  const networkIconSrc = getNetworkIcon(currentNetwork);

  return (
    <>
      <div>
        <PickerNetwork
          avatarNetworkProps={{
            backgroundColor: testNetworkBackgroundColor,
            role: 'img',
            name: currentNetwork.name,
          }}
          aria-label={`${t('networkMenu')} ${currentNetwork.name}`}
          label={currentNetwork.name}
          src={networkIconSrc}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
          // eslint-disable-next-line id-length, no-restricted-globals
          onClick={(e: React.MouseEvent<HTMLElement>) => {
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
    </>
  );
};
