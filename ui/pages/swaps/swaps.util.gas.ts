import { NetworkClientId } from '@metamask/network-controller';
import {
  GasFeeEstimates,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { submitRequestToBackground } from '../../store/background-connection';

export function estimateGasFee(request: {
  transactionParams: TransactionParams;
  chainId?: Hex;
  networkClientId?: NetworkClientId;
}): Promise<{ estimates: GasFeeEstimates }> {
  return submitRequestToBackground('estimateGasFee', [request]);
}
