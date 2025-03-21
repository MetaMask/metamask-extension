import { useSelector } from 'react-redux';
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
import { useAsyncResult } from '../useAsyncResult';

export const useTokenAlerts = () => {
  const fromToken = useSelector(getFromToken);
  const fromChain = useSelector(getFromChain);
  const toToken = useSelector(getToToken);
  const toChain = useSelector(getToChain);

  const { value: tokenAlert } =
    useAsyncResult<TokenAlertWithLabelIds | null>(async () => {
      if (fromToken && fromChain && toToken && toChain) {
        const chainName = convertChainIdToBlockAidChainName(
          toChain?.chainId as AllowedBridgeChainIds,
        );
        if (chainName) {
          return await fetchTokenAlert(chainName, toToken.address);
        }
      }
      return null;
    }, [toToken, toChain]);

  return { tokenAlert };
};

export default useTokenAlerts;
