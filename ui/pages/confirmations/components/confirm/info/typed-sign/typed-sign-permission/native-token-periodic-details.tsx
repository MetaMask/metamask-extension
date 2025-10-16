import { Text, TextVariant } from '@metamask/design-system-react';
import { NativeTokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import type { Hex } from '@metamask/utils';
import React from 'react';

import { DefaultRootState, useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { getNativeTokenInfo } from '../../../../../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { formatPeriodDuration } from './typed-sign-permission-util';
import { DateAndTimeRow } from './date-and-time-row';
import { NativeAmountRow } from './native-amount-row';

type NativeTokenInfo = {
  symbol: string;
  decimals: number;
  name: string;
};

/**
 * Component for displaying native token periodic permission details.
 * Shows period amount, duration, start date, and expiration date for native token periodic permissions.
 *
 * @param props - The component props
 * @param props.permission - The native token periodic permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @param props.chainId - The chain ID for which the permission is being granted.
 * @returns JSX element containing the native token periodic permission details
 */
export const NativeTokenPeriodicDetails: React.FC<{
  permission: NativeTokenPeriodicPermission;
  expiry: number | null;
  chainId: Hex;
}> = ({ permission, expiry, chainId }) => {
  const t = useI18nContext();

  if (!permission.data.startTime) {
    // This should never happen - validation should protect against it. This
    // check is here as a type guard.
    throw new Error('Start time is required');
  }

  const { startTime, periodAmount, periodDuration } = permission.data;

  const { symbol, decimals } = useSelector<DefaultRootState, NativeTokenInfo>(
    (state) => getNativeTokenInfo(state, chainId) as NativeTokenInfo,
  );

  const tokenImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];

  return (
    <ConfirmInfoSection data-testid="native-token-periodic-details-section">
      <NativeAmountRow
        label={t('confirmFieldAllowance')}
        value={periodAmount}
        symbol={symbol}
        decimals={decimals}
        imageUrl={tokenImageUrl}
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
