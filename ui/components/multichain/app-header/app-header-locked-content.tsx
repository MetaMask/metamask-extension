import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import MetafoxLogo from '../../ui/metafox-logo';
import { PickerNetwork } from '../../component-library';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getTestNetworkBackgroundColor } from '../../../selectors';
import { MultichainNetwork } from '../../../selectors/multichain';

type AppHeaderLockedContentProps = {
  currentNetwork: MultichainNetwork;
  networkOpenCallback: () => void;
};

export const AppHeaderLockedContent = ({
  currentNetwork,
  networkOpenCallback,
}: AppHeaderLockedContentProps) => {
  const t = useI18nContext();
  const history = useHistory();

  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  return (
    <>
      <div>
        <PickerNetwork
          avatarNetworkProps={{
            backgroundColor: testNetworkBackgroundColor,
            role: 'img',
            name: currentNetwork?.nickname ?? '',
          }}
          aria-label={`${t('networkMenu')} ${currentNetwork?.nickname}`}
          label={currentNetwork?.nickname ?? ''}
          src={currentNetwork?.network?.rpcPrefs?.imageUrl}
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
