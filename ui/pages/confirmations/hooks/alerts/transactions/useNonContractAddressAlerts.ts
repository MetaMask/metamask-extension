import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';

import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useIsUpgradeTransaction } from '../../../components/confirm/info/hooks/useIsUpgradeTransaction';
import { NonContractAddressAlertMessage } from './NonContractAddressAlertMessage';
import { useContractCode } from './useContractCode';

export function useNonContractAddressAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const { isUpgrade } = useIsUpgradeTransaction();
  const { pending, value } = useContractCode(
    currentConfirmation?.txParams?.to as Hex,
    currentConfirmation?.networkClientId as string,
  );

  const isSendingHexData =
    currentConfirmation?.txParams?.data !== undefined &&
    currentConfirmation?.txParams?.data !== '0x';

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
