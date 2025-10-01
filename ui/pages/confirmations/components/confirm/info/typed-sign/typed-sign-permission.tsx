import {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
} from '@metamask/gator-permissions-controller';
import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';
import React from 'react';
import { isSnapId } from '@metamask/snaps-utils';

import { SignatureRequestType } from '../../../../types/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowDate,
  ConfirmInfoRowText,
  ConfirmInfoRowTextTokenUnits,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowUrl } from '../../../../../../components/app/confirm/info/row/url';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { NetworkRow } from '../shared/network-row/network-row';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';
import { ConfirmInfoRowCurrency } from '../../../../../../components/app/confirm/info/row/currency';
import { DAY, WEEK } from '../../../../../../../shared/constants/time';

import { selectNetworkConfigurationByChainId } from '../../../../../../selectors';
import { useSelector } from 'react-redux';
import { getTokenByAccountAndAddressAndChainId } from '../../../../../../selectors/assets';
import { Skeleton } from '../../../../../../components/component-library/skeleton';

/**
 * Formats a period duration in seconds to a human-readable string.
 * Converts common durations (daily, weekly) to readable labels, otherwise shows seconds.
 *
 * @param seconds - The duration in seconds to format
 * @returns A formatted string representing the duration (e.g., "Daily", "Weekly", "3600 seconds")
 */
const formatPeriodDuration = (periodSeconds: number) => {
  let periodMilliseconds = periodSeconds * 1000;

  if (periodMilliseconds === WEEK) {
    return 'Every week';
  }

  if (periodMilliseconds === DAY) {
    return 'Every day';
  }

  const periods: string[] = [];

  if (periodMilliseconds > WEEK) {
    const weekCount = Math.floor(periodMilliseconds / WEEK);
    periods.push(`${weekCount} week${weekCount > 1 ? 's' : ''}`);
    periodMilliseconds %= WEEK;
  }

  if (periodMilliseconds > DAY) {
    const dayCount = Math.floor(periodMilliseconds / DAY);
    periods.push(`${dayCount} day${dayCount > 1 ? 's' : ''}`);
    periodMilliseconds %= DAY;
  }
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;

  if (periodMilliseconds > HOUR) {
    const hourCount = Math.floor(periodMilliseconds / HOUR);
    periods.push(`${hourCount} hour${hourCount > 1 ? 's' : ''}`);
    periodMilliseconds %= HOUR;
  }

  if (periodMilliseconds > MINUTE) {
    const minuteCount = Math.floor(periodMilliseconds / MINUTE);
    periods.push(`${minuteCount} minute${minuteCount > 1 ? 's' : ''}`);
    periodMilliseconds %= MINUTE;
  }

  if (periodMilliseconds > 0) {
    const secondsCount = Math.floor(periodMilliseconds / 1000);
    periods.push(`${secondsCount} second${secondsCount > 1 ? 's' : ''}`);
    periodMilliseconds %= 1000;
  }

  const result = periods.reduce((acc, period, index) => {
    // only add 'and' for the final period part, and only if there's more than one period
    const isFirstPeriod = index === 0;
    const hasAnd = !isFirstPeriod && index === periods.length - 1;

    const separator = isFirstPeriod ? '' : hasAnd ? ' and ' : ', ';

    return `${acc}${separator} ${period}`;
  }, '');

  return `Every ${result}`;
};

/**
 * Component for displaying native token periodic permission details.
 * Shows period amount, duration, start date, and expiration date for native token periodic permissions.
 *
 * @param props - The component props
 * @param props.permission - The native token periodic permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the native token periodic permission details
 */
const NativeTokenPeriodicDetails: React.FC<{
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

/**
 * Component for displaying native token stream permission details.
 * Shows initial allowance, max allowance, stream start date, expiration date, stream rate, and daily available amount.
 *
 * @param props - The component props
 * @param props.permission - The native token stream permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the native token stream permission details
 */
const NativeTokenStreamDetails: React.FC<{
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

/**
 * Component for displaying ERC20 token periodic permission details.
 * Shows token address, period amount, duration, start date, and expiration date for ERC20 token periodic permissions.
 *
 * @param props - The component props
 * @param props.permission - The ERC20 token periodic permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the ERC20 token periodic permission details
 */
const Erc20TokenPeriodicDetails: React.FC<{
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
    <>
      <ConfirmInfoSection data-testid="erc20-token-periodic-details-section">
        <ConfirmInfoRow
          label="Allowance amount"
          tooltip="The amount that can be spent per period"
        >
          {decimals !== undefined ? (
            <ConfirmInfoRowTextTokenUnits
              value={periodAmountBn}
              decimals={decimals}
            />
          ) : (
            <Skeleton width="50%" height={20} />
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
    </>
  );
};

/**
 * Component for displaying ERC20 token stream permission details.
 * Shows token address, initial allowance, max allowance, stream start date, expiration date, stream rate, and daily available amount.
 *
 * @param props - The component props
 * @param props.permission - The ERC20 token stream permission data
 * @param props.expiry - The expiration timestamp (null if no expiry)
 * @returns JSX element containing the ERC20 token stream permission details
 */
const Erc20TokenStreamDetails: React.FC<{
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
            {decimals !== undefined ? (
              <ConfirmInfoRowTextTokenUnits
                value={initialAmount as BigNumber}
                decimals={decimals}
              />
            ) : (
              <Skeleton width="50%" height={20} />
            )}
          </ConfirmInfoRow>
        )}

        {maxAmount && (
          <ConfirmInfoRow
            label="Max allowance"
            tooltip="The maximum allowance of the permission"
          >
            {decimals !== undefined ? (
              <ConfirmInfoRowTextTokenUnits
                value={maxAmount as BigNumber}
                decimals={decimals}
              />
            ) : (
              <Skeleton width="50%" height={20} />
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
          {decimals !== undefined ? (
            <ConfirmInfoRowTextTokenUnits
              value={amountPerSecond}
              decimals={decimals}
            />
          ) : (
            <Skeleton width="50%" height={20} />
          )}
        </ConfirmInfoRow>
        <ConfirmInfoRow
          label="Available per day"
          tooltip="The available amount per day"
        >
          {decimals !== undefined ? (
            <ConfirmInfoRowTextTokenUnits
              value={amountPerDay}
              decimals={decimals}
            />
          ) : (
            <Skeleton width="50%" height={20} />
          )}
        </ConfirmInfoRow>
      </ConfirmInfoSection>
    </>
  );
};

const getErc20TokenDetails = ({
  tokenAddress,
  chainId,
}: {
  tokenAddress: Hex;
  chainId: Hex;
}): {
  label: string | undefined;
  decimals: number | undefined;
} => {
  const token = useSelector((state) =>
    getTokenByAccountAndAddressAndChainId(
      state,
      undefined, // Defaults to the selected account
      tokenAddress,
      chainId as Hex,
    ),
  );

  return {
    label: token?.name || token?.symbol,
    decimals: token?.decimals,
  };
};

const getNativeTokenLabel = (chainId: Hex): string => {
  const { nativeCurrency: symbol, name } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  return symbol || name;
};

/**
 * Main component for displaying typed signature permission information.
 * Renders different permission details based on the permission type (native token periodic/stream, ERC20 token periodic/stream).
 * Displays common information like request origin, justification, network, and signing account.
 *
 * @returns JSX element containing the permission information UI
 */
const TypedSignPermissionInfo: React.FC = () => {
  const t = useI18nContext();
  const {
    currentConfirmation: { decodedPermission, id },
  } = useConfirmContext<SignatureRequestType>();

  if (!decodedPermission) {
    throw new Error('Decoded permission is undefined');
  }

  let permissionDetail: React.ReactNode;
  let tokenLabel: string | undefined;
  let permissionTitle: string;

  const { expiry } = decodedPermission;

  switch (decodedPermission.permission.type) {
    case 'native-token-periodic': {
      permissionTitle = 'Native Token Subscription';

      const permission =
        decodedPermission.permission as NativeTokenPeriodicPermission;

      tokenLabel = getNativeTokenLabel(decodedPermission.chainId);

      permissionDetail = (
        <NativeTokenPeriodicDetails permission={permission} expiry={expiry} />
      );

      break;
    }
    case 'native-token-stream': {
      permissionTitle = 'Native Token Stream';

      const permission =
        decodedPermission.permission as NativeTokenStreamPermission;

      tokenLabel = getNativeTokenLabel(decodedPermission.chainId);

      permissionDetail = (
        <NativeTokenStreamDetails permission={permission} expiry={expiry} />
      );

      break;
    }
    case 'erc20-token-periodic': {
      permissionTitle = 'Token Subscription';

      const permission =
        decodedPermission.permission as Erc20TokenPeriodicPermission;

      const { label, decimals } = getErc20TokenDetails({
        tokenAddress: permission.data.tokenAddress,
        chainId: decodedPermission.chainId,
      });

      tokenLabel = label;

      permissionDetail = (
        <Erc20TokenPeriodicDetails
          permission={permission}
          expiry={expiry}
          decimals={decimals}
        />
      );

      break;
    }
    case 'erc20-token-stream': {
      permissionTitle = 'Token Stream';

      const permission =
        decodedPermission.permission as Erc20TokenStreamPermission;

      const { label, decimals } = getErc20TokenDetails({
        tokenAddress: permission.data.tokenAddress,
        chainId: decodedPermission.chainId,
      });

      tokenLabel = label;

      permissionDetail = (
        <Erc20TokenStreamDetails
          permission={permission}
          decimals={decimals}
          expiry={expiry}
        />
      );

      break;
    }
    default:
      throw new Error('Invalid permission type');
  }

  const requestFromTooltipMessage = isSnapId(decodedPermission.origin)
    ? t('requestFromInfoSnap')
    : t('requestFromInfo');

  const {
    chainId,
    permission: {
      data: { tokenAddress },
    },
  } = decodedPermission;

  tokenAddress;

  // todo: add the permission title
  return (
    <>
      <ConfirmInfoSection data-testid="confirmation_permission-section">
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={id}
          label={t('requestFrom')}
          tooltip={requestFromTooltipMessage}
        >
          <ConfirmInfoRowUrl url={decodedPermission.origin} />
        </ConfirmInfoAlertRow>
        <NetworkRow />

        <ConfirmInfoRow
          label="Token"
          tooltip="The token that the permission is for"
        >
          {tokenLabel ? (
            <ConfirmInfoRowText text={tokenLabel} />
          ) : (
            <ConfirmInfoRowAddress address={tokenAddress} chainId={chainId} />
          )}
        </ConfirmInfoRow>

        {tokenLabel && tokenAddress && (
          <ConfirmInfoRow label="">
            <ConfirmInfoRowAddress address={tokenAddress} chainId={chainId} />
          </ConfirmInfoRow>
        )}
      </ConfirmInfoSection>
      <ConfirmInfoSection data-testid="confirmation_justification-section">
        <ConfirmInfoRow
          label="Justification"
          tooltip="The justification provided by the website for requesting this permission"
        >
          {decodedPermission.permission.justification}
        </ConfirmInfoRow>
        <SigningInWithRow />
      </ConfirmInfoSection>
      {permissionDetail}
    </>
  );
};

export default TypedSignPermissionInfo;
