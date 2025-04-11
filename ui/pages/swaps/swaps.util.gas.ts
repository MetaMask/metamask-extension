import type { NetworkClientId } from '@metamask/network-controller';
import type {
  GasFeeEstimates,
  TransactionParams,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import { submitRequestToBackground } from '../../store/background-connection';

export async function estimateGasFee(request: {
  transactionParams: TransactionParams;
  chainId?: Hex;
  networkClientId?: NetworkClientId;
}): Promise<{ estimates: GasFeeEstimates }> {
  return submitRequestToBackground('estimateGasFee', [request]);
}
