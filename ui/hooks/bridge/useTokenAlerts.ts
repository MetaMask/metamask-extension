import { useSelector } from 'react-redux';
import {
  formatAddressToCaipReference,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { getToToken } from '../../ducks/bridge/selectors';
import {
  convertChainIdToBlockAidChainName,
  fetchTokenAlert,
} from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import type { TokenAlertWithLabelIds } from '../../../shared/types/security-alerts-api';
import { AllowedBridgeChainIds } from '../../../shared/constants/bridge';
import { useAsyncResult } from '../useAsync';

export const useTokenAlerts = () => {
  const toToken = useSelector(getToToken);

  const { value: tokenAlert } =
    useAsyncResult<TokenAlertWithLabelIds | null>(async () => {
      if (!isNativeAddress(toToken.address)) {
        const chainName = convertChainIdToBlockAidChainName(
          toToken.chainId as AllowedBridgeChainIds,
        );
        if (chainName) {
          return await fetchTokenAlert(
            chainName,
            formatAddressToCaipReference(toToken.address),
          );
        }
      }
      return null;
    }, [toToken.address, toToken.chainId]);

  return { tokenAlert };
};

export default useTokenAlerts;
