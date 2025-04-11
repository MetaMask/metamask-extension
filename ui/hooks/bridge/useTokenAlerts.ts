import { formatAddressToCaipReference } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';

import type { AllowedBridgeChainIds } from '../../../shared/constants/bridge';
import {
  convertChainIdToBlockAidChainName,
  fetchTokenAlert,
} from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import type { TokenAlertWithLabelIds } from '../../../shared/types/security-alerts-api';
import {
  getFromToken,
  getFromChain,
  getToToken,
  getToChain,
} from '../../ducks/bridge/selectors';
import { useAsyncResult } from '../useAsync';

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
          return await fetchTokenAlert(
            chainName,
            formatAddressToCaipReference(toToken.address),
          );
        }
      }
      return null;
    }, [toToken, toChain]);

  return { tokenAlert };
};

export default useTokenAlerts;
