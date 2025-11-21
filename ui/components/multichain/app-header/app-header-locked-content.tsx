import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
  const t = useI18nContext();
  const navigate = useNavigate();

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
          navigate(DEFAULT_ROUTE);
        }}
      />
    </>
  );
};
