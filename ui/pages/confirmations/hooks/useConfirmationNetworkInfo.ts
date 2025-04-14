import { useSelector } from 'react-redux';

import { Hex } from '@metamask/utils';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useConfirmContext } from '../context/confirm';
import { selectNetworkConfigurationByChainId } from '../../../selectors';

function useConfirmationNetworkInfo() {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
  // eslint-disable-next-line id-length
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const chainId = currentConfirmation?.chainId as Hex;

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  let networkDisplayName = '';
  let networkImageUrl = '';

  if (currentConfirmation) {
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
