import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import {
  getFromToken,
  getFromChain,
  getToToken,
  getToChain,
} from '../../ducks/bridge/selectors';
import {
  convertChainIdToBlockAidChainName,
  fetchTokenAlert,
} from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { TokenAlertWithLabelIds } from '../../../shared/types/security-alerts-api';
import { AllowedBridgeChainIds } from '../../../shared/constants/bridge';

export const useTokenAlerts = () => {
  const [tokenAlert, setTokenAlert] = useState<TokenAlertWithLabelIds | null>(
    null,
  );

  const fromToken = useSelector(getFromToken);
  const fromChain = useSelector(getFromChain);
  const toToken = useSelector(getToToken);
  const toChain = useSelector(getToChain);

  useEffect(() => {
    async function fetchData() {

      // At the moment we only support Solana Chain
      if (!fromToken || !fromChain || !toToken || !toChain) {
        return;
      }

      const chainName = convertChainIdToBlockAidChainName(
        toChain?.chainId as AllowedBridgeChainIds,
      );

      if (!chainName) return null;

      const tAlert = await fetchTokenAlert(chainName, toToken.address);

      if (tAlert) {
        setTokenAlert(tAlert);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toToken, toChain]);

  return { tokenAlert };
};

export default useTokenAlerts;
