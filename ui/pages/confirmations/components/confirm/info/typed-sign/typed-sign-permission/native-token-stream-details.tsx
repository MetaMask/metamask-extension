import { BigNumber } from 'bignumber.js';
import { NativeTokenStreamPermission } from '@metamask/gator-permissions-controller';
import type { Hex } from '@metamask/utils';
import React from 'react';
import { useSelector } from 'react-redux';

import { DAY } from '../../../../../../../../shared/constants/time';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowDivider } from '../../../../../../../components/app/confirm/info/row';
import {
  getNativeTokenInfo,
  MetaMaskReduxState,
} from '../../../../../../../selectors';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { NativeAmountRow } from './native-amount-row';
import { DateAndTimeRow } from './date-and-time-row';

/**
 * Component for displaying native token stream permission details.
 * Shows initial allowance, max allowance, stream start date, expiration date, stream rate, and daily available amount.
 *
 * @param props - The component props
 * @param props.permission - The native token stream permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @param props.chainId - The chain ID for which the permission is being granted.
 * @returns JSX element containing the native token stream permission details
 */
export const NativeTokenStreamDetails: React.FC<{
  permission: NativeTokenStreamPermission;
  chainId: Hex;
  expiry: number | null;
}> = ({ permission, expiry, chainId }) => {
  const t = useI18nContext();

  if (!permission.data.startTime) {
    // This should never happen - validation should protect against it. This
    // check is here as a type guard.
    throw new Error('Start time is required');
  }
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  // DAY is in milliseconds, so we divide by 1000 to get seconds
  const amountPerDay = new BigNumber(amountPerSecond).mul(DAY / 1000);

  const { symbol, decimals } = useSelector((state: MetaMaskReduxState) =>
    getNativeTokenInfo(state.metamask.networkConfigurationsByChainId, chainId),
  );

  const tokenImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];

  return (
    <>
      <ConfirmInfoSection data-testid="native-token-stream-details-section">
        {initialAmount && (
          <NativeAmountRow
            label={t('confirmFieldInitialAllowance')}
            value={initialAmount}
            symbol={symbol}
            decimals={decimals}
            imageUrl={tokenImageUrl}
          />
        )}
        {maxAmount && (
          <NativeAmountRow
            label={t('confirmFieldMaxAllowance')}
            value={maxAmount}
            symbol={symbol}
            decimals={decimals}
            imageUrl={tokenImageUrl}
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

      <ConfirmInfoSection data-testid="native-token-stream-stream-rate-section">
        <NativeAmountRow
          label={t('confirmFieldStreamRate')}
          value={amountPerSecond}
          symbol={symbol}
          decimals={decimals}
          imageUrl={tokenImageUrl}
        />
        <NativeAmountRow
          label={t('confirmFieldAvailablePerDay')}
          value={amountPerDay}
          symbol={symbol}
          decimals={decimals}
          imageUrl={tokenImageUrl}
        />
      </ConfirmInfoSection>
    </>
  );
};
