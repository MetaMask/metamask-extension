import { useEffect, useMemo, useState } from 'react';
import { NETWORKS_BYPASSING_VALIDATION } from '@metamask/controller-utils';
import { Severity } from '../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../context/confirm';
import type { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { DEPRECATED_NETWORKS } from '../../../../../shared/constants/network';
import { AddEthereumChainContext } from '../../external/add-ethereum-chain/types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSafeChains } from '../../../settings/networks-tab/networks-form/use-safe-chains';
import { jsonRpcRequest } from '../../../../../shared/modules/rpc.utils';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';

// Ported from templates/add-ethereum-chain.js
export function useAddEthereumChainAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const t = useI18nContext();
  const { safeChains } = useSafeChains();
  const { currentConfirmation } = useConfirmContext<AddEthereumChainContext>();
  const pendingApproval = currentConfirmation;
  const chainId = pendingApproval?.requestData?.chainId;

  const matchedChain = useMemo(() => {
    if (!safeChains || !chainId) {
      return null;
    }

    return safeChains.find((c) => Number(c.chainId) === parseInt(chainId, 16));
  }, [safeChains, chainId]);

  useEffect(() => {
    if (!pendingApproval) {
      setAlerts([]);
      return;
    }

    const validate = async () => {
      const nextAlerts: Alert[] = [];
      const { requestData } = pendingApproval;

      // Only proceed with safe chains validation if we have a matched chain
      if (!matchedChain) {
        setAlerts(nextAlerts);
        return;
      }

      const bypassMap = NETWORKS_BYPASSING_VALIDATION as Record<
        string,
        { name?: string; symbol?: string; rpcUrl?: string }
      >;
      const networkByPassingValidation =
        bypassMap[requestData.chainId.toLowerCase()] || {};

      // Default info alert
      const chainName = matchedChain.name || requestData.chainName;
      const title = t('allowAddRpc');

      nextAlerts.push({
        key: 'allowAddRpc',
        message: t('allowAddRpcDescription', [chainName]),
        severity: Severity.Info,
        field: RowAlertKey.RpcUrl,
        reason: title,
        inlineAlertText: '',
        showArrow: false,
      });

      if (
        matchedChain.name?.toLowerCase() !==
          requestData.chainName.toLowerCase() &&
        networkByPassingValidation?.name?.toLowerCase() !==
          requestData.chainName.toLowerCase()
      ) {
        nextAlerts.push({
          key: 'mismatchedNetworkName',
          message: t('mismatchedNetworkName'),
          severity: Severity.Warning,
          field: RowAlertKey.ChainName,
          inlineAlertText: '',
          showArrow: false,
        });
      }

      if (
        matchedChain.nativeCurrency?.symbol?.toLowerCase() !==
          requestData.ticker?.toLowerCase() &&
        networkByPassingValidation?.symbol?.toLowerCase() !==
          requestData.ticker?.toLowerCase()
      ) {
        nextAlerts.push({
          key: 'mismatchedNetworkSymbol',
          message: t('mismatchedNetworkSymbol'),
          severity: Severity.Warning,
          field: RowAlertKey.ChainName,
          inlineAlertText: '',
          showArrow: false,
        });
      }

      const { origin } = new URL(requestData.rpcUrl);

      if (
        !matchedChain.rpc?.map((rpc) => new URL(rpc).origin).includes(origin) &&
        !networkByPassingValidation?.rpcUrl?.includes(origin)
      ) {
        nextAlerts.push({
          key: 'mismatchedRpcUrl',
          message: t('mismatchedRpcUrl'),
          severity: Severity.Warning,
          field: RowAlertKey.RpcUrl,
          inlineAlertText: '',
          showArrow: false,
        });
      }

      if (
        (DEPRECATED_NETWORKS as unknown as string[]).includes(
          requestData.chainId,
        )
      ) {
        nextAlerts.push({
          key: 'deprecatedNetwork',
          message: t('deprecatedNetwork'),
          severity: Severity.Warning,
          field: RowAlertKey.ChainName,
          inlineAlertText: '',
          showArrow: false,
        });
      }

      try {
        const endpointChainId = (await jsonRpcRequest(
          requestData.rpcUrl,
          'eth_chainId',
        )) as string;

        if (requestData.chainId !== endpointChainId) {
          nextAlerts.push({
            key: 'mismatchedRpcChainId',
            message: t('mismatchedRpcChainId'),
            severity: Severity.Warning,
            field: RowAlertKey.ChainName,
            inlineAlertText: '',
            showArrow: false,
          });
        }
      } catch (err) {
        console.error(
          `Request for method 'eth_chainId' on ${requestData.rpcUrl} failed`,
          err,
        );

        nextAlerts.push({
          key: 'errorWhileConnectingToRPC',
          message: t('errorWhileConnectingToRPC'),
          severity: Severity.Warning,
          field: RowAlertKey.RpcUrl,
          inlineAlertText: '',
          showArrow: false,
        });
      }

      setAlerts(nextAlerts);
    };

    validate();
  }, [chainId, matchedChain, pendingApproval, t]);

  return alerts;
}
