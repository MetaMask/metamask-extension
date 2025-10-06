import { useSelector } from 'react-redux';

import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { selectNetworkConfigurationByChainId } from '../../../selectors';
import { useUnapprovedTransaction } from './transactions/useUnapprovedTransaction';
import { useSignatureRequest } from './signatures/useSignatureRequest';

function useConfirmationNetworkInfo() {
  const t = useI18nContext();
  const transactionMeta = useUnapprovedTransaction();
  const signatureRequest = useSignatureRequest();
  const chainId = transactionMeta?.chainId ?? signatureRequest?.chainId;

  const networkConfiguration = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  let networkDisplayName = '';
  let networkImageUrl = '';

  if (chainId) {
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
