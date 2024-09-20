import { useSelector } from 'react-redux';

import { Hex } from '@metamask/utils';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';

import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../selectors';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useConfirmContext } from '../context/confirm';

function useConfirmationNetworkInfo() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const currentChainId = useSelector(getCurrentChainId);

  let networkDisplayName = '';
  let networkImageUrl = '';

  if (currentConfirmation) {
    // use the current confirmation chainId, else use the current network chainId
    const chainId =
      (currentConfirmation?.chainId as Hex | undefined) ?? currentChainId;

    const networkConfiguration = networkConfigurations[chainId];

    networkDisplayName =
      networkConfiguration?.name ??
      NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
      t('privateNetwork');

    networkImageUrl =
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ];
  }

  return {
    networkImageUrl,
    networkDisplayName,
  };
}

export default useConfirmationNetworkInfo;
