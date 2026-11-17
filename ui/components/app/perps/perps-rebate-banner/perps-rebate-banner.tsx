import React from 'react';
import { useSelector } from 'react-redux';
import { RebateBanner } from '../../rebates';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import {
  getIsPerpsRebatesEnabled,
  usePerpsRebate,
  type UsePerpsRebateParams,
} from '../../../../hooks/perps/usePerpsRebate';
import { PERPS_REBATE_ALLOWED_CAPABILITIES } from '../../../../hooks/rewards/rewards-money-messenger';

export const PERPS_REBATE_BANNER_TEST_ID = 'perps-rebate-banner';

type PerpsRebateBannerProps = UsePerpsRebateParams & {
  /** Extra classes appended to the banner's box, e.g. a margin. */
  className?: string;
};

const PerpsRebateBannerContent = ({
  className,
  coin,
  direction,
  notionalUsd,
}: PerpsRebateBannerProps) => {
  const rebatePercent = usePerpsRebate({ coin, direction, notionalUsd });

  if (!rebatePercent) {
    return null;
  }

  return (
    <RebateBanner
      rebatePercent={rebatePercent}
      testId={PERPS_REBATE_BANNER_TEST_ID}
      className={className}
    />
  );
};

/**
 * Loads the current Perps rebate quote and renders the shared banner when
 * eligibility is confirmed.
 */
export const PerpsRebateBanner = ({
  className,
  coin,
  direction,
  notionalUsd,
}: PerpsRebateBannerProps) => {
  const isEnabled = useSelector(getIsPerpsRebatesEnabled);

  if (!isEnabled) {
    return null;
  }

  return (
    <RouteMessengerProvider
      path="perps-rebate"
      capabilities={PERPS_REBATE_ALLOWED_CAPABILITIES}
    >
      <PerpsRebateBannerContent
        className={className}
        coin={coin}
        direction={direction}
        notionalUsd={notionalUsd}
      />
    </RouteMessengerProvider>
  );
};
