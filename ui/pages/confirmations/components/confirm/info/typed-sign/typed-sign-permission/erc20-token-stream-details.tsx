import { Erc20TokenStreamPermission } from '@metamask/gator-permissions-controller';
import React from 'react';

import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowDivider } from '../../../../../../../components/app/confirm/info/row';
import { DAY } from '../../../../../../../../shared/constants/time';
import { fetchErc20Decimals } from '../../../../../utils/token';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { TokenAmountRow } from './token-amount-row';
import { DateAndTimeRow } from './date-and-time-row';

/**
 * Component for displaying ERC20 token stream permission details.
 * Shows token address, initial allowance, max allowance, stream start date, expiration date, stream rate, and daily available amount.
 *
 * @param props - The component props
 * @param props.permission - The ERC20 token stream permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @param props.chainId - The chain ID for which the permission is being granted.
 * @returns JSX element containing the ERC20 token stream permission details
 */
export const Erc20TokenStreamDetails: React.FC<{
  permission: Erc20TokenStreamPermission;
  chainId: Hex;
  expiry: number | null;
}> = ({ permission, expiry, chainId }) => {
  const t = useI18nContext();

  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  if (!startTime) {
    // This should never happen - validation should protect against it. This
    // check is here as a type guard.
    throw new Error('Start time is required');
  }

  const amountPerDay = new BigNumber(amountPerSecond).mul(DAY / 1000); // DAY is in milliseconds

  const metadataResult = useAsyncResult(() =>
    fetchErc20Decimals(permission.data.tokenAddress, chainId),
  );

  const decimals = metadataResult.value;

  return (
    <>
      <ConfirmInfoSection data-testid="erc20-token-stream-details-section">
        {initialAmount && (
          <TokenAmountRow
            label={t('confirmFieldInitialAllowance')}
            value={initialAmount}
            decimals={decimals}
            tokenAddress={permission.data.tokenAddress}
            chainId={chainId}
          />
        )}

        {maxAmount && (
          <TokenAmountRow
            label={t('confirmFieldMaxAllowance')}
            value={maxAmount}
            decimals={decimals}
            tokenAddress={permission.data.tokenAddress}
            chainId={chainId}
          />
        )}

        <ConfirmInfoRowDivider />

        <DateAndTimeRow
          timestamp={startTime}
          label={t('confirmFieldStartDate')}
        />
        {expiry && (
          <DateAndTimeRow
            timestamp={expiry}
            label={t('confirmFieldExpiration')}
          />
        )}
      </ConfirmInfoSection>

      <ConfirmInfoSection data-testid="erc20-token-stream-stream-rate-section">
        <TokenAmountRow
          label={t('confirmFieldStreamRate')}
          value={amountPerSecond}
          decimals={decimals}
          tokenAddress={permission.data.tokenAddress}
          chainId={chainId}
        />
        <TokenAmountRow
          label={t('confirmFieldAvailablePerDay')}
          value={amountPerDay}
          decimals={decimals}
          tokenAddress={permission.data.tokenAddress}
          chainId={chainId}
        />
      </ConfirmInfoSection>
    </>
  );
};
