import { useSelector } from 'react-redux';
import {
  getFromToken,
  getFromChain,
  getToToken,
  getToChain,
} from '../../ducks/bridge/selectors';
import {
  convertChainIdToBlockAidChainName,
  fetchTokenScan,
  FetchTokenScanResponse,
} from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { AllowedBridgeChainIds } from '../../../shared/constants/bridge';
import { useAsyncResult } from '../useAsyncResult';

export const useTokenScan = () => {
  const fromToken = useSelector(getFromToken);
  const fromChain = useSelector(getFromChain);
  const toToken = useSelector(getToToken);
  const toChain = useSelector(getToChain);

  const { value } = useAsyncResult<FetchTokenScanResponse | null>(async () => {
    if (fromToken && fromChain && toToken && toChain) {
      const chainName = convertChainIdToBlockAidChainName(
        toChain?.chainId as AllowedBridgeChainIds,
      );
      if (chainName) {
        return await fetchTokenScan(chainName, toToken.address);
      }
    }
    return null;
  }, [toToken, toChain]);

  const { tokenAlert, fees } = value ?? {};

  return { tokenAlert, fees };
};

export default useTokenScan;
