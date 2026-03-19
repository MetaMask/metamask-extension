import { useSelector } from 'react-redux';

import { useTransactionMetadataRequest } from '../useTransactionMetadataRequest';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';

export const useTransactionNativeTicker = () => {
  const currentConfirmation = useTransactionMetadataRequest();
  const { chainId } = currentConfirmation;
  const networkConfiguration = useSelector(getNetworkConfigurationsByChainId)?.[
    chainId
  ];
  return networkConfiguration?.nativeCurrency;
};
