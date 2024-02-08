import { useSelector } from 'react-redux';

import {
  NETWORK_TO_NAME_MAP,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';

import {
  currentConfirmationSelector,
  getAllNetworks,
} from '../../../selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';

import { useI18nContext } from '../../../hooks/useI18nContext';

type KeyOfNetworkName = keyof typeof NETWORK_TO_NAME_MAP;

function useConfirmationNetworkInfo() {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const allNetworks = useSelector(getAllNetworks);
  const providerConfig = useSelector(getProviderConfig);
  const t = useI18nContext();

  let networkDisplayName = '';
  let confirmationNetwork;

  if (currentConfirmation) {
    // use the current confirmation chainId, else use the current network chainId
    const currentChainId =
      currentConfirmation?.chainId ?? providerConfig.chainId;
    confirmationNetwork = allNetworks.find(
      ({ chainId }) => chainId === currentChainId,
    );
    if (confirmationNetwork) {
      const { nickname, providerType, type } = confirmationNetwork;
      if (providerType === NETWORK_TYPES.RPC || type === NETWORK_TYPES.RPC) {
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
