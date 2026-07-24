import {
  isCrossChain,
  isNativeAddress,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getGaslessBridgeWith7702EnabledForChain } from '../../../../shared/lib/selectors';
import { getSentinelNetworkFlags } from '../../../store/actions';
import { isHardwareWallet } from '../../../../shared/lib/selectors/keyring';
import {
  getFromToken,
  getIsStxEnabled,
  getToChain,
  type BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { getMaybeHexChainId } from '../../../ducks/bridge/utils';
import { useAsyncResult } from '../../../hooks/useAsync';
export const useGasIncludedSupport = () => {
  const fromToken = useSelector(getFromToken);
  const hexChainId = fromToken?.chainId
    ? getMaybeHexChainId(fromToken.chainId)
    : undefined;

  const toChain = useSelector(getToChain);

  const isSmartTransaction = useSelector(getIsStxEnabled);
  const isUsingHardwareWallet = useSelector(isHardwareWallet);
  const isGaslessBridgeWith7702Enabled = useSelector((state: BridgeAppState) =>
    getGaslessBridgeWith7702EnabledForChain(state, hexChainId),
  );

  const isBridge = isCrossChain(fromToken?.chainId, toChain?.chainId);

  // Fetch all sentinel flags for src chain
  const { value: networkFlags } = useAsyncResult(
    async () =>
      hexChainId ? await getSentinelNetworkFlags(hexChainId) : undefined,
    [hexChainId],
  );

  // If native EVM and simulationIncludeFees are supported, gasless request params pretty much get ignored
  // This means the backend can always return a gasIncluded quote
  const nativeGasIncluded = useMemo(() => {
    return fromToken?.assetId &&
      networkFlags &&
      isNativeAddress(fromToken.assetId)
      ? networkFlags.simulationIncludeFees
      : undefined;
  }, [networkFlags?.simulationIncludeFees, fromToken?.assetId]);

  // GasIncluded flag
  const gasIncluded = useMemo(() => {
    if (isSolanaChainId(fromToken?.chainId)) {
      return true;
    }
    return isSmartTransaction && networkFlags?.sendBundle;
  }, [isSmartTransaction, networkFlags?.sendBundle, fromToken?.chainId]);

  // GasIncluded7702 flag
  const gasIncluded7702 = useMemo(() => {
    if (isUsingHardwareWallet) {
      return false;
    }

    if (gasIncluded) {
      return false;
    }

    if (isBridge && !isGaslessBridgeWith7702Enabled) {
      return false;
    }

    if (networkFlags?.relayTransactions) {
      return true;
    }

    return false;
  }, [
    isUsingHardwareWallet,
    gasIncluded,
    isBridge,
    isGaslessBridgeWith7702Enabled,
    networkFlags?.relayTransactions,
  ]);

  return {
    nativeGasIncluded,
    /** True if STX and sendBundle are available, or if gasIncluded7702 is true */
    gasIncluded: gasIncluded || gasIncluded7702,
    /** True if 7702 is enabled AND sendBundle is not supported */
    gasIncluded7702,
  };
};
