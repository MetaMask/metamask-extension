import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { readAddressAsContract } from '../../../../../../shared/modules/contract-utils';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useAsyncResult } from '../../../../../hooks/useAsyncResult';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { NonContractAddressAlertMessage } from './NonContractAddressAlertMessage';

export function useNonContractAddressAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const isSendingHexData =
    currentConfirmation?.txParams?.data !== undefined &&
    currentConfirmation?.txParams?.data !== '0x';

  const { value, pending } = useAsyncResult(async () => {
    return await readAddressAsContract(
      global.ethereumProvider,
      (currentConfirmation?.txParams?.to || '0x') as Hex,
    );
  }, [currentConfirmation?.txParams?.to]);

  const isInteractingWithNonContractAddress =
    !pending && value?.isContractAddress === false;

  const isSendingHexDataWhileInteractingWithNonContractAddress =
    isSendingHexData && isInteractingWithNonContractAddress;

  return useMemo(() => {
    if (!isSendingHexDataWhileInteractingWithNonContractAddress) {
      return [];
    }

    return [
      {
        field: RowAlertKey.To,
        isBlocking: false,
        key: 'hexDataWhileInteractingWithNonContractAddress',
        reason: t('nonContractAddressAlertTitle'),
        content: NonContractAddressAlertMessage(networkConfigurations),
        severity: Severity.Warning,
      },
    ];
  }, [isSendingHexDataWhileInteractingWithNonContractAddress]);
}
