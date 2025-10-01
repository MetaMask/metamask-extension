import { Erc20TokenStreamPermission } from '@metamask/gator-permissions-controller';
import React from 'react';

import { BigNumber } from 'bignumber.js';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDate,
  ConfirmInfoRowTextTokenUnits,
} from '../../../../../../../components/app/confirm/info/row';
import { Skeleton } from '../../../../../../../components/component-library/skeleton';
import { DAY } from '../../../../../../../../shared/constants/time';

/**
 * Component for displaying ERC20 token stream permission details.
 * Shows token address, initial allowance, max allowance, stream start date, expiration date, stream rate, and daily available amount.
 *
 * @param props - The component props
 * @param props.permission - The ERC20 token stream permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @param props.decimals
 * @returns JSX element containing the ERC20 token stream permission details
 */
export const Erc20TokenStreamDetails: React.FC<{
  permission: Erc20TokenStreamPermission;
  decimals: number | undefined;
  expiry: number | null;
}> = ({ permission, expiry, decimals }) => {
  const initialAmount =
    permission.data.initialAmount &&
    new BigNumber(permission.data.initialAmount);

  const maxAmount =
    permission.data.maxAmount && new BigNumber(permission.data.maxAmount);

  const amountPerSecond = new BigNumber(permission.data.amountPerSecond);
  const amountPerDay = amountPerSecond.mul(DAY / 1000); // DAY is in milliseconds

  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const { startTime } = permission.data;

  return (
    <>
      <ConfirmInfoSection data-testid="erc20-token-stream-details-section">
        {initialAmount && (
          <ConfirmInfoRow
            label="Initial allowance"
            tooltip="The initial allowance of the permission"
          >
            {decimals === undefined ? (
              <Skeleton width="50%" height={20} />
            ) : (
              <ConfirmInfoRowTextTokenUnits
                value={initialAmount as BigNumber}
                decimals={decimals}
              />
            )}
          </ConfirmInfoRow>
        )}

        {maxAmount && (
          <ConfirmInfoRow
            label="Max allowance"
            tooltip="The maximum allowance of the permission"
          >
            {decimals === undefined ? (
              <Skeleton width="50%" height={20} />
            ) : (
              <ConfirmInfoRowTextTokenUnits
                value={maxAmount as BigNumber}
                decimals={decimals}
              />
            )}
          </ConfirmInfoRow>
        )}

        <ConfirmInfoRow
          label="Stream start"
          tooltip="The start date of the stream"
        >
          <ConfirmInfoRowDate unixTimestamp={startTime} />
        </ConfirmInfoRow>

        {expiry && (
          <ConfirmInfoRow
            label="Expiration"
            tooltip="The expiration date of the permission"
          >
            <ConfirmInfoRowDate unixTimestamp={expiry} />
          </ConfirmInfoRow>
        )}
      </ConfirmInfoSection>

      <ConfirmInfoSection data-testid="erc20-token-stream-stream-rate-section">
        <ConfirmInfoRow
          label="Stream rate"
          tooltip="The stream rate of the permission"
        >
          {decimals === undefined ? (
            <Skeleton width="50%" height={20} />
          ) : (
            <ConfirmInfoRowTextTokenUnits
              value={amountPerSecond}
              decimals={decimals}
            />
          )}
        </ConfirmInfoRow>
        <ConfirmInfoRow
          label="Available per day"
          tooltip="The available amount per day"
        >
          {decimals === undefined ? (
            <Skeleton width="50%" height={20} />
          ) : (
            <ConfirmInfoRowTextTokenUnits
              value={amountPerDay}
              decimals={decimals}
            />
          )}
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};
