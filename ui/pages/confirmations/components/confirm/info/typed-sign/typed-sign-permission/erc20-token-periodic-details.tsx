import React from 'react';

import { Hex } from '@metamask/utils';
import { Erc20TokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import { Text, TextVariant } from '@metamask/design-system-react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { fetchErc20Decimals } from '../../../../../utils/token';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { formatPeriodDuration } from './typed-sign-permission-util';
import { TokenAmountRow } from './token-amount-row';
import { DateAndTimeRow } from './date-and-time-row';

/**
 * Component for displaying ERC20 token periodic permission details.
 * Shows token address, period amount, duration, start date, and expiration date for ERC20 token periodic permissions.
 *
 * @param props - The component props
 * @param props.permission - The ERC20 token periodic permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @param props.chainId - The chain ID for which the permission is being granted.
 * @returns JSX element containing the ERC20 token periodic permission details
 */
export const Erc20TokenPeriodicDetails: React.FC<{
  permission: Erc20TokenPeriodicPermission;
  chainId: Hex;
  expiry: number | null;
}> = ({ permission, expiry, chainId }) => {
  const t = useI18nContext();

  if (!permission.data.startTime) {
    // This should never happen - validation should protect against it. This
    // check is here as a type guard.
    throw new Error('Start time is required');
  }

  const { periodAmount, periodDuration, startTime } = permission.data;

  const metadataResult = useAsyncResult(() =>
    fetchErc20Decimals(permission.data.tokenAddress, chainId),
  );

  const decimals = metadataResult.value;

  return (
    <ConfirmInfoSection data-testid="erc20-token-periodic-details-section">
      <TokenAmountRow
        label={t('confirmFieldAllowance')}
        tokenAddress={permission.data.tokenAddress}
        value={periodAmount}
        decimals={decimals}
        chainId={chainId}
      />

      <ConfirmInfoRow label={t('confirmFieldFrequency')}>
        <Text variant={TextVariant.BodyMd}>
          {formatPeriodDuration(t, periodDuration)}
        </Text>
      </ConfirmInfoRow>

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
  );
};
