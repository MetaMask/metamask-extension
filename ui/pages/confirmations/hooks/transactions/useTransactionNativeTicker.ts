import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';

export const useTransactionNativeTicker = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const chainId = currentConfirmation?.chainId;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  if (!chainId || !networkConfigurations || !networkConfigurations[chainId]) {
    return undefined;
  }

  return networkConfigurations[chainId].nativeCurrency;
};
