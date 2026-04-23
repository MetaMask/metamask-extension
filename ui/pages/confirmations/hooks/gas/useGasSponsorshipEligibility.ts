import { Interface } from '@ethersproject/abi';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useMemo } from 'react';

import {
  GAS_SPONSORSHIP_BUFFER_BPS,
  GAS_SPONSORSHIP_VAULT_ABI,
  GAS_SPONSORSHIP_CAMPAIGN_ID,
  GAS_SPONSORSHIP_CAMPAIGN_NAME,
  GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
  isGasSponsorshipChainSupported,
} from '../../../../../shared/constants/gas-sponsorship';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { estimateGas } from '../../../../store/actions';
import { useConfirmContext } from '../../context/confirm';
import { useGaslessSupportedSmartTransactions } from './useGaslessSupportedSmartTransactions';
import { useGasSponsorshipCampaign } from './useGasSponsorshipCampaign';
import { useGasSponsorshipDevToggle } from './useGasSponsorshipDevToggle';

const BPS_DENOMINATOR = 10_000n;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const sponsorshipVaultInterface = new Interface(GAS_SPONSORSHIP_VAULT_ABI);

type SponsorshipEstimate = {
  estimationFailed: boolean;
  maxFeePerGasWei?: bigint;
  requiredWei?: bigint;
  settleTxCostWei?: bigint;
  settleTxGasLimit?: bigint;
  userTxCostWei?: bigint;
};

const parseHexToBigInt = (value?: string): bigint | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

const parseHexQuantityToBigInt = (value?: string): bigint | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const hasHexPrefix = value.startsWith('0x');
    return BigInt(hasHexPrefix ? value : `0x${value}`);
  } catch {
    return undefined;
  }
};

const applyBufferBps = (value: bigint): bigint => {
  const numerator =
    value * (BPS_DENOMINATOR + BigInt(GAS_SPONSORSHIP_BUFFER_BPS));
  return (numerator + (BPS_DENOMINATOR - 1n)) / BPS_DENOMINATOR;
};

const getUserTransactionEstimate = (
  transactionMeta?: TransactionMeta,
): Omit<
  SponsorshipEstimate,
  'requiredWei' | 'settleTxCostWei' | 'settleTxGasLimit'
> => {
  if (!transactionMeta?.txParams) {
    return {
      estimationFailed: true,
    };
  }

  const userTxGasLimit =
    parseHexToBigInt(transactionMeta.txParams.gas) ??
    parseHexToBigInt(
      (transactionMeta as TransactionMeta & { gasLimitNoBuffer?: Hex })
        .gasLimitNoBuffer,
    );
  const maxFeePerGasWei =
    parseHexToBigInt(transactionMeta.txParams.maxFeePerGas) ??
    parseHexToBigInt(transactionMeta.txParams.gasPrice);

  if (!userTxGasLimit || !maxFeePerGasWei) {
    return {
      estimationFailed: true,
    };
  }

  return {
    estimationFailed: false,
    maxFeePerGasWei,
    userTxCostWei: userTxGasLimit * maxFeePerGasWei,
  };
};

export function useGasSponsorshipEligibility() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { enabled: isDevToggleEnabled } = useGasSponsorshipDevToggle();
  const { isSmartTransaction } = useGaslessSupportedSmartTransactions();
  const isSupportedChain = isGasSponsorshipChainSupported(
    transactionMeta?.chainId,
  );
  const shouldEvaluateSponsorship = Boolean(
    isDevToggleEnabled &&
      isSupportedChain &&
      !isSmartTransaction &&
      transactionMeta?.txParams,
  );

  const {
    campaign,
    error: campaignError,
    pending: campaignPending,
  } = useGasSponsorshipCampaign({ enabled: shouldEvaluateSponsorship });

  const userEstimate = useMemo(
    () => getUserTransactionEstimate(transactionMeta),
    [transactionMeta],
  );
  const settleTxFrom = transactionMeta?.txParams?.from;

  const canEstimateSettleTransaction = Boolean(
    shouldEvaluateSponsorship && settleTxFrom && userEstimate.maxFeePerGasWei,
  );

  const {
    value: settleTxGasLimit,
    pending: settleTxEstimatePending,
    error: settleTxEstimateError,
  } = useAsyncResult(async () => {
    if (!canEstimateSettleTransaction || !settleTxFrom) {
      return undefined;
    }

    const settleData = sponsorshipVaultInterface.encodeFunctionData(
      'settleCampaignGas',
      [GAS_SPONSORSHIP_CAMPAIGN_ID, 1],
    );

    const settleGasEstimate = await estimateGas({
      data: settleData,
      from: settleTxFrom,
      to: GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
      value: '0x0',
    });

    return parseHexQuantityToBigInt(settleGasEstimate);
  }, [canEstimateSettleTransaction, settleTxFrom]);

  const estimate = useMemo(() => {
    if (!shouldEvaluateSponsorship) {
      return {
        estimationFailed: false,
      } as SponsorshipEstimate;
    }

    if (userEstimate.estimationFailed) {
      return userEstimate as SponsorshipEstimate;
    }

    const settleGas =
      settleTxGasLimit &&
      userEstimate.maxFeePerGasWei &&
      settleTxGasLimit > 0n &&
      userEstimate.maxFeePerGasWei > 0n
        ? settleTxGasLimit
        : undefined;

    const settleTxCostWei =
      settleGas && userEstimate.maxFeePerGasWei
        ? settleGas * userEstimate.maxFeePerGasWei
        : undefined;
    const requiredWei =
      settleTxCostWei && userEstimate.userTxCostWei
        ? applyBufferBps(userEstimate.userTxCostWei + settleTxCostWei)
        : undefined;

    const estimationFailed =
      userEstimate.estimationFailed ||
      (canEstimateSettleTransaction &&
        !settleTxEstimatePending &&
        (settleTxEstimateError !== undefined || settleGas === undefined));

    return {
      ...userEstimate,
      estimationFailed,
      requiredWei,
      settleTxCostWei,
      settleTxGasLimit: settleGas,
    } as SponsorshipEstimate;
  }, [
    canEstimateSettleTransaction,
    shouldEvaluateSponsorship,
    settleTxEstimateError,
    settleTxEstimatePending,
    settleTxGasLimit,
    userEstimate,
  ]);

  const hasCampaign = Boolean(
    campaign && campaign.sponsor.toLowerCase() !== ZERO_ADDRESS,
  );
  const hasSufficientBalance = Boolean(
    estimate.requiredWei !== undefined &&
      campaign?.remainingBalanceWei !== undefined &&
      campaign.remainingBalanceWei >= estimate.requiredWei,
  );
  const isEligible = Boolean(
    shouldEvaluateSponsorship &&
      hasCampaign &&
      !estimate.estimationFailed &&
      hasSufficientBalance &&
      !campaignPending &&
      !campaignError &&
      !settleTxEstimatePending,
  );

  let healthStatus = 'insufficient';
  if (
    campaignPending ||
    (canEstimateSettleTransaction && settleTxEstimatePending)
  ) {
    healthStatus = 'loading';
  } else if (campaignError || estimate.estimationFailed) {
    healthStatus = 'error';
  } else if (hasSufficientBalance) {
    healthStatus = 'ready';
  }

  return {
    campaignAddress: GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
    campaignId: GAS_SPONSORSHIP_CAMPAIGN_ID,
    campaignName: GAS_SPONSORSHIP_CAMPAIGN_NAME,
    campaignPending,
    campaignRemainingBalanceWei: campaign?.remainingBalanceWei,
    estimate,
    healthStatus,
    isEligible,
    isSmartTransaction,
    isSupportedChain,
  };
}
