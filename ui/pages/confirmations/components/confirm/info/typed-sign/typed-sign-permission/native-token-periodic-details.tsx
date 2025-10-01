import { NativeTokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import React from 'react';

import {
  ConfirmInfoRow,
  ConfirmInfoRowDate,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowCurrency } from '../../../../../../../components/app/confirm/info/row/currency';
import { formatPeriodDuration } from './typed-sign-permission-util';

/**
 * Component for displaying native token periodic permission details.
 * Shows period amount, duration, start date, and expiration date for native token periodic permissions.
 *
 * @param props - The component props
 * @param props.permission - The native token periodic permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the native token periodic permission details
 */
export const NativeTokenPeriodicDetails: React.FC<{
  permission: NativeTokenPeriodicPermission;
  expiry: number | null;
}> = ({ permission, expiry }) => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const { startTime, periodAmount, periodDuration } = permission.data;

  return (
    <>
      <ConfirmInfoSection data-testid="native-token-periodic-details-section">
        <ConfirmInfoRow
          label="Allowance amount"
          tooltip="The amount that can be spent per period"
        >
          <ConfirmInfoRowCurrency value={periodAmount} />
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
    </>
  );
};
