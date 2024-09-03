import { useSelector } from 'react-redux';

import {
  NETWORK_TO_NAME_MAP,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';

import { getAllNetworks } from '../../../selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useConfirmContext } from '../context/confirm';

type KeyOfNetworkName = keyof typeof NETWORK_TO_NAME_MAP;

function useConfirmationNetworkInfo() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const allNetworks = useSelector(getAllNetworks);
  const providerConfig = useSelector(getProviderConfig);

  let networkDisplayName = '';
  let confirmationNetwork;

  if (currentConfirmation) {
    // use the current confirmation chainId, else use the current network chainId
    const currentChainId =
      currentConfirmation?.chainId ?? providerConfig.chainId;
    confirmationNetwork = allNetworks.find(
      ({ id, chainId }) =>
        chainId === currentChainId &&
        (providerConfig.type === NETWORK_TYPES.RPC
          ? id === providerConfig.id
          : id === providerConfig.type),
    );

    if (confirmationNetwork) {
      const { nickname } = confirmationNetwork;
      if (providerConfig.type === NETWORK_TYPES.RPC) {
        networkDisplayName = nickname ?? t('privateNetwork');
      } else {
        networkDisplayName =
          NETWORK_TO_NAME_MAP[confirmationNetwork?.chainId as KeyOfNetworkName];
      }
    }
  }

  return {
    networkImageUrl: confirmationNetwork?.rpcPrefs?.imageUrl ?? '',
    networkDisplayName,
  };
}

export default useConfirmationNetworkInfo;
