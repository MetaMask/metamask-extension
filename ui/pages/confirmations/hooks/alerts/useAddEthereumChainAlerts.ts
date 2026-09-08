import { useEffect, useMemo, useState } from 'react';
import { NETWORKS_BYPASSING_VALIDATION } from '@metamask/controller-utils';
import { Severity } from '../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../context/confirm';
import type { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { DEPRECATED_NETWORKS } from '../../../../../shared/constants/network';
import { AddEthereumChainContext } from '../../external/add-ethereum-chain/types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSafeChains } from '../../../../components/multichain/networks-form/use-safe-chains';
import {
  isRpcRateLimitError,
  jsonRpcRequest,
} from '../../../../../shared/lib/rpc.utils';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { EMPTY_ARRAY } from '../../../../selectors/shared';

const ROUTEMESH_RPC_ORIGIN = 'https://lb.routeme.sh';

const isRouteMeshRpcForChain = (rpcUrl: URL, chainId: string) => {
  const pathname = rpcUrl.pathname.replace(/\/$/u, '');
  const decimalChainId = parseInt(chainId, 16);

  return (
    rpcUrl.origin === ROUTEMESH_RPC_ORIGIN &&
    pathname === `/rpc/evm/${decimalChainId}`
  );
};

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

      const rpcUrl = new URL(requestData.rpcUrl);

      if (
        !matchedChain.rpc
          ?.map((rpc) => new URL(rpc).origin)
          .includes(rpcUrl.origin) &&
        !networkByPassingValidation?.rpcUrl?.includes(rpcUrl.origin) &&
        !isRouteMeshRpcForChain(rpcUrl, requestData.chainId)
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

        const alertKey = isRpcRateLimitError(err)
          ? 'rpcUrlRateLimited'
          : 'errorWhileConnectingToRPC';

        nextAlerts.push({
          key: alertKey,
          message: t(alertKey),
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

  return pendingApproval ? alerts : EMPTY_ARRAY;
}
