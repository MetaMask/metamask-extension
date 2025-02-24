import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import {
  getFromToken,
  getFromChain,
  getToToken,
  getToChain,
} from '../../ducks/bridge/selectors';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { fetchTokenAlert } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { TokenAlertWithLabelIds } from '../../../shared/types/security-alerts-api';

export const useSolanaTokenAlerts = () => {
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
      if (
        !fromToken ||
        !fromChain ||
        !toToken ||
        !toChain ||
        (toChain?.chainId as string) !== MultichainNetworks.SOLANA
      ) {
        return;
      }

      const chainName = 'solana';

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

export default useSolanaTokenAlerts;
