import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';

export const useTransactionNativeTicker = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const chainId = currentConfirmation?.chainId;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkConfiguration = chainId
    ? networkConfigurations?.[chainId]
    : undefined;
  return networkConfiguration?.nativeCurrency;
};
