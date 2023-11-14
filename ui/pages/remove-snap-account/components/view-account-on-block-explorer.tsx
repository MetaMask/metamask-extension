import React from 'react';
import { getAccountLink } from '@metamask/etherscan-link';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import {
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
} from '../../../selectors';

interface ViewAccountOnBlockExplorerProps {
  publicAddress: string;
}

const ViewAccountOnBlockExplorer = ({
  publicAddress,
}: ViewAccountOnBlockExplorerProps) => {
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider, shallowEqual);
  const blockExplorerUrl = getAccountLink(publicAddress, chainId, rpcPrefs);
  return (
    <Icon
      onClick={() => {
        global.platform.openTab({ url: blockExplorerUrl });
      }}
      name={IconName.Share}
      color={IconColor.primaryDefault}
      size={IconSize.Sm}
    />
  );
};

export default React.memo(ViewAccountOnBlockExplorer);
