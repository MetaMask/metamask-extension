import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';

export const useTransactionNativeTicker = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId } = currentConfirmation;
  const networkConfiguration = useSelector(getNetworkConfigurationsByChainId)?.[
    chainId
  ];
  return networkConfiguration?.nativeCurrency;
};
