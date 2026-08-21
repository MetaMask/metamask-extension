import BigNumber from 'bignumber.js';
import { useQuery } from '@tanstack/react-query';
import { getGasFeeTimeEstimate } from '../../../../store/actions';

export function useGasFeeTimeEstimate({
  maxPriorityFeePerGas,
  maxFeePerGas,
  enabled,
}: {
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  enabled: boolean;
}) {
  const priorityFee = maxPriorityFeePerGas
    ? new BigNumber(maxPriorityFeePerGas, 10).toString(10)
    : '';
  const fee = maxFeePerGas
    ? new BigNumber(maxFeePerGas, 10).toString(10)
    : '';

  return useQuery({
    queryKey: ['gasFeeTimeEstimate', priorityFee, fee],
    queryFn: () => getGasFeeTimeEstimate(priorityFee, fee),
    enabled: Boolean(priorityFee && fee && enabled),
  });
}
