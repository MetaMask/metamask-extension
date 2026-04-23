import { type Hex } from '@metamask/utils';
import { useCallback, useEffect, useState } from 'react';

import {
  GAS_SPONSORSHIP_CAMPAIGN_ID,
  GAS_SPONSORSHIP_SUPPORTED_CHAIN_ID,
} from '../../../../../shared/constants/gas-sponsorship';
import {
  findNetworkClientIdByChainId,
  getGasSponsorshipCampaign,
} from '../../../../store/actions';

const POLLING_INTERVAL_MS = 15_000;

export type GasSponsorshipCampaign = {
  settlementEscrow: Hex;
  sponsor: Hex;
  remainingBalanceWei: bigint;
};

export function useGasSponsorshipCampaign({ enabled = true } = {}) {
  const [campaign, setCampaign] = useState<GasSponsorshipCampaign | undefined>(
    undefined,
  );
  const [pending, setPending] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | undefined>(undefined);

  const pollCampaign = useCallback(async (networkClientId: string) => {
    const campaignData = await getGasSponsorshipCampaign(
      GAS_SPONSORSHIP_CAMPAIGN_ID,
      networkClientId,
    );
    const balanceWei =
      campaignData.availableBalanceWei ?? campaignData.remainingBalanceWei;

    return {
      settlementEscrow: campaignData.settlementEscrow,
      sponsor: campaignData.sponsor,
      remainingBalanceWei: BigInt(balanceWei),
    } as GasSponsorshipCampaign;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPending(false);
      setError(undefined);
      return;
    }

    let cancelled = false;
    let resolvedNetworkClientId: string | undefined;

    const refresh = async () => {
      try {
        if (!resolvedNetworkClientId) {
          resolvedNetworkClientId = await findNetworkClientIdByChainId(
            GAS_SPONSORSHIP_SUPPORTED_CHAIN_ID,
          );
        }

        const nextCampaign = await pollCampaign(resolvedNetworkClientId);
        if (cancelled) {
          return;
        }

        setCampaign(nextCampaign);
        setError(undefined);
      } catch (refreshError) {
        if (!cancelled) {
          setError(refreshError as Error);
        }
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    };

    setPending(true);
    refresh();

    const pollInterval = setInterval(() => {
      refresh();
    }, POLLING_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [enabled, pollCampaign]);

  return {
    campaign,
    error,
    pending,
  };
}
