import { Erc20TokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import React from 'react';

import { BigNumber } from 'bignumber.js';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDate,
  ConfirmInfoRowTextTokenUnits,
} from '../../../../../../../components/app/confirm/info/row';
import { Skeleton } from '../../../../../../../components/component-library/skeleton';
import { formatPeriodDuration } from './typed-sign-permission-util';

/**
 * Component for displaying ERC20 token periodic permission details.
 * Shows token address, period amount, duration, start date, and expiration date for ERC20 token periodic permissions.
 *
 * @param props - The component props
 * @param props.permission - The ERC20 token periodic permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @param props.decimals
 * @returns JSX element containing the ERC20 token periodic permission details
 */
export const Erc20TokenPeriodicDetails: React.FC<{
  permission: Erc20TokenPeriodicPermission;
  expiry: number | null;
  decimals: number | undefined;
}> = ({ permission, expiry, decimals }) => {
  const periodAmountBn = new BigNumber(permission.data.periodAmount);

  const { periodDuration, startTime } = permission.data;

  if (!startTime) {
    throw new Error('Start time is required');
  }

  return (
    <ConfirmInfoSection data-testid="erc20-token-periodic-details-section">
      <ConfirmInfoRow
        label="Allowance amount"
        tooltip="The amount that can be spent per period"
      >
        {decimals === undefined ? (
          <Skeleton width="50%" height={20} />
        ) : (
          <ConfirmInfoRowTextTokenUnits
            value={periodAmountBn}
            decimals={decimals}
          />
        )}
      </ConfirmInfoRow>

      <ConfirmInfoRow
        label="Frequency"
        tooltip="The frequency of the permission"
      >
        {formatPeriodDuration(periodDuration)}
      </ConfirmInfoRow>

      {startTime && (
        <ConfirmInfoRow
          label="Start"
          tooltip="The start date of the permission"
        >
          <ConfirmInfoRowDate unixTimestamp={startTime} />
        </ConfirmInfoRow>
      )}

      {expiry && (
        <ConfirmInfoRow
          label="Expiration"
          tooltip="The expiration date of the permission"
        >
          <ConfirmInfoRowDate unixTimestamp={expiry} />
        </ConfirmInfoRow>
      )}
    </ConfirmInfoSection>
  );
};
