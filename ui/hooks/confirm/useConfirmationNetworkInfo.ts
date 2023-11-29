import { useSelector } from 'react-redux';

import {
  NETWORK_TO_NAME_MAP,
  NETWORK_TYPES,
} from '../../../shared/constants/network';

import { currentConfirmationSelector, getAllNetworks } from '../../selectors';
import { getProviderConfig } from '../../ducks/metamask/metamask';

import { useI18nContext } from '../useI18nContext';

type KeyOfNetworkName = keyof typeof NETWORK_TO_NAME_MAP;

function useConfirmationNetworkInfo() {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const allNetworks = useSelector(getAllNetworks);
  const providerConfig = useSelector(getProviderConfig);
  const t = useI18nContext();

  let networkDisplayName = '';
  let confirmationNetwork;

  if (currentConfirmation) {
    // here chainId of confirmation is used
    // if confirmation does not have a chainId then current network is displayed
    const currentChainId =
      currentConfirmation?.chainId ?? providerConfig.chainId;
    confirmationNetwork = allNetworks.find(
      ({ chainId }) => chainId === currentChainId,
    );
    if (confirmationNetwork) {
      const { nickname, providerType } = confirmationNetwork;
      if (providerType === NETWORK_TYPES.RPC) {
        networkDisplayName = nickname ?? t('privateNetwork');
      } else {
        networkDisplayName =
          NETWORK_TO_NAME_MAP[confirmationNetwork?.chainId as KeyOfNetworkName];
      }
    }
  }

  return {
    networkImageUrl: confirmationNetwork?.rpcPrefs?.imageUrl,
    networkDisplayName,
  };
}

export default useConfirmationNetworkInfo;
