import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { readAddressAsContract } from '../../../../../../shared/modules/contract-utils';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useIsUpgradeTransaction } from '../../../components/confirm/info/hooks/useIsUpgradeTransaction';
import { NonContractAddressAlertMessage } from './NonContractAddressAlertMessage';

export function useNonContractAddressAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const { isUpgrade } = useIsUpgradeTransaction();

  const isSendingHexData =
    currentConfirmation?.txParams?.data !== undefined &&
    currentConfirmation?.txParams?.data !== '0x';

  const { value, pending } = useAsyncResult(async () => {
    return await readAddressAsContract(
      global.ethereumProvider,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (currentConfirmation?.txParams?.to || '0x') as Hex,
    );
  }, [currentConfirmation?.txParams?.to]);

  const isReadContractFailure = value?.contractCode === null;

  const isInteractingWithNonContractAddress =
    !pending && !isReadContractFailure && value?.isContractAddress === false;

  const isContractDeploymentTx =
    currentConfirmation?.type === TransactionType.deployContract;

  const isSendingHexDataWhileInteractingWithNonContractAddress =
    isSendingHexData &&
    isInteractingWithNonContractAddress &&
    !isContractDeploymentTx;

  return useMemo(() => {
    if (!isSendingHexDataWhileInteractingWithNonContractAddress || isUpgrade) {
      return [];
    }

    return [
      {
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'hexDataWhileInteractingWithNonContractAddress',
        reason: t('nonContractAddressAlertTitle'),
        content: NonContractAddressAlertMessage(networkConfigurations),
        severity: Severity.Warning,
      },
    ];
  }, [
    isSendingHexDataWhileInteractingWithNonContractAddress,
    isUpgrade,
    networkConfigurations,
  ]);
}
