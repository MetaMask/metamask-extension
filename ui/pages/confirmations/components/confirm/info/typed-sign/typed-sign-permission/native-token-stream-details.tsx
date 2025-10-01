import { NativeTokenStreamPermission } from '@metamask/gator-permissions-controller';
import React from 'react';

import { BigNumber } from 'bignumber.js';
import { DAY } from '../../../../../../../../shared/constants/time';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDate,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoRowCurrency } from '../../../../../../../components/app/confirm/info/row/currency';

/**
 * Component for displaying native token stream permission details.
 * Shows initial allowance, max allowance, stream start date, expiration date, stream rate, and daily available amount.
 *
 * @param props - The component props
 * @param props.permission - The native token stream permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the native token stream permission details
 */
export const NativeTokenStreamDetails: React.FC<{
  permission: NativeTokenStreamPermission;
  expiry: number | null;
}> = ({ permission, expiry }) => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  const amountPerSecondBn = new BigNumber(amountPerSecond);
  const amountPerDay = amountPerSecondBn.mul(DAY / 1000); // DAY is in milliseconds

  return (
    <>
      <ConfirmInfoSection data-testid="native-token-stream-details-section">
        {initialAmount && (
          <ConfirmInfoRow
            label="Initial allowance"
            tooltip="The initial allowance of the permission"
          >
            <ConfirmInfoRowCurrency value={initialAmount} />
          </ConfirmInfoRow>
        )}

        {maxAmount && (
          <ConfirmInfoRow
            label="Max allowance"
            tooltip="The maximum allowance of the permission"
          >
            <ConfirmInfoRowCurrency value={maxAmount} />
          </ConfirmInfoRow>
        )}

        <ConfirmInfoRow label="Start" tooltip="The start date of the stream">
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

      <ConfirmInfoSection data-testid="native-token-stream-stream-rate-section">
        <ConfirmInfoRow
          label="Stream rate"
          tooltip="The stream rate of the permission"
        >
          <ConfirmInfoRowCurrency value={amountPerSecond} />
        </ConfirmInfoRow>
        <ConfirmInfoRow
          label="Available per day"
          tooltip="The available amount per day"
        >
          <ConfirmInfoRowCurrency value={amountPerDay.toString(16)} />
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};
