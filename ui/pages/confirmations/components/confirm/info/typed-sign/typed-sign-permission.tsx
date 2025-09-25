import {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
} from '@metamask/gator-permissions-controller';
import { hexToBigInt } from '@metamask/utils';
import React from 'react';
import { isSnapId } from '@metamask/snaps-utils';

import { SignatureRequestType } from '../../../../types/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDate,
  ConfirmInfoRowDivider,
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

/**
 * Formats a period duration in seconds to a human-readable string.
 * Converts common durations (daily, weekly) to readable labels, otherwise shows seconds.
 *
 * @param seconds - The duration in seconds to format
 * @returns A formatted string representing the duration (e.g., "Daily", "Weekly", "3600 seconds")
 */
const formatPeriodDuration = (seconds: number) => {
  // multiply by 1000 to convert to milliseconds
  switch (seconds * 1000) {
    case DAY:
      return 'Daily';
    case WEEK:
      return 'Weekly';
    default:
      return `${seconds} seconds`;
  }
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
const NativeTokenPeriodDetails: React.FC<{
  permission: NativeTokenPeriodicPermission;
  expiry: number | null;
}> = ({ permission, expiry }) => {
  const periodAmount = hexToBigInt(permission.data.periodAmount);
  const { periodDuration } = permission.data;

  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const { startTime } = permission.data;

  return (
    <>
      <ConfirmInfoSection data-testid="native-token-periodic-details-section">
        <ConfirmInfoRow
          label="Period amount"
          tooltip="The amount that can be spent per period"
        >
          <ConfirmInfoRowCurrency value={periodAmount.toString(16)} />
        </ConfirmInfoRow>

        <ConfirmInfoRow
          label="Period duration"
          tooltip="The length of time of the period"
        >
          {formatPeriodDuration(periodDuration)}
        </ConfirmInfoRow>

        {startTime && (
          <ConfirmInfoRow
            label="Start date"
            tooltip="The start date of the permission"
          >
            <ConfirmInfoRowDate unixTimestamp={startTime} />
          </ConfirmInfoRow>
        )}

        {expiry && (
          <ConfirmInfoRow
            label="Expiration date"
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
  const initialAmount = permission.data.initialAmount
    ? hexToBigInt(permission.data.initialAmount)
    : null;
  const maxAmount = permission.data.maxAmount
    ? hexToBigInt(permission.data.maxAmount)
    : null;
  const amountPerSecond = hexToBigInt(permission.data.amountPerSecond);
  const amountPerDay = (amountPerSecond * BigInt(DAY)) / 1000n; // DAY is in milliseconds

  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const { startTime } = permission.data;

  return (
    <>
      <ConfirmInfoSection data-testid="native-token-stream-details-section">
        {initialAmount && (
          <ConfirmInfoRow
            label="Initial allowance"
            tooltip="The initial allowance of the permission"
          >
            <ConfirmInfoRowCurrency value={initialAmount.toString(16)} />
          </ConfirmInfoRow>
        )}

        {maxAmount && (
          <ConfirmInfoRow
            label="Max allowance"
            tooltip="The maximum allowance of the permission"
          >
            <ConfirmInfoRowCurrency value={maxAmount.toString(16)} />
          </ConfirmInfoRow>
        )}

        <ConfirmInfoRow
          label="Stream start date"
          tooltip="The start date of the stream"
        >
          <ConfirmInfoRowDate unixTimestamp={startTime} />
        </ConfirmInfoRow>

        {expiry && (
          <ConfirmInfoRow
            label="Expiration date"
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
          <ConfirmInfoRowCurrency value={amountPerSecond.toString(16)} />
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
const Erc20TokenPeriodDetails: React.FC<{
  permission: Erc20TokenPeriodicPermission;
  expiry: number | null;
}> = ({ permission, expiry }) => {
  const periodAmount = hexToBigInt(permission.data.periodAmount);
  const { periodDuration } = permission.data;
  const { tokenAddress } = permission.data;

  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const { startTime } = permission.data;

  return (
    <>
      <ConfirmInfoSection data-testid="erc20-token-periodic-details-section">
        <ConfirmInfoRow
          label="Token address"
          tooltip="The ERC20 token contract address"
        >
          {tokenAddress}
        </ConfirmInfoRow>

        <ConfirmInfoRow
          label="Period amount"
          tooltip="The amount that can be spent per period"
        >
          <ConfirmInfoRowCurrency value={periodAmount.toString(16)} />
        </ConfirmInfoRow>

        <ConfirmInfoRow
          label="Period duration"
          tooltip="The length of time of the period"
        >
          {formatPeriodDuration(periodDuration)}
        </ConfirmInfoRow>

        {startTime && (
          <ConfirmInfoRow
            label="Start date"
            tooltip="The start date of the permission"
          >
            <ConfirmInfoRowDate unixTimestamp={startTime} />
          </ConfirmInfoRow>
        )}

        {expiry && (
          <ConfirmInfoRow
            label="Expiration date"
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
  expiry: number | null;
}> = ({ permission, expiry }) => {
  const initialAmount = permission.data.initialAmount
    ? hexToBigInt(permission.data.initialAmount)
    : null;
  const maxAmount = permission.data.maxAmount
    ? hexToBigInt(permission.data.maxAmount)
    : null;
  const amountPerSecond = hexToBigInt(permission.data.amountPerSecond);
  const amountPerDay = (amountPerSecond * BigInt(DAY)) / 1000n; // DAY is in milliseconds
  const { tokenAddress } = permission.data;

  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const { startTime } = permission.data;

  return (
    <>
      <ConfirmInfoSection data-testid="erc20-token-stream-details-section">
        <ConfirmInfoRow
          label="Token address"
          tooltip="The ERC20 token contract address"
        >
          {tokenAddress}
        </ConfirmInfoRow>

        {initialAmount && (
          <ConfirmInfoRow
            label="Initial allowance"
            tooltip="The initial allowance of the permission"
          >
            <ConfirmInfoRowCurrency value={initialAmount.toString(16)} />
          </ConfirmInfoRow>
        )}

        {maxAmount && (
          <ConfirmInfoRow
            label="Max allowance"
            tooltip="The maximum allowance of the permission"
          >
            <ConfirmInfoRowCurrency value={maxAmount.toString(16)} />
          </ConfirmInfoRow>
        )}

        <ConfirmInfoRow
          label="Stream start date"
          tooltip="The start date of the stream"
        >
          <ConfirmInfoRowDate unixTimestamp={startTime} />
        </ConfirmInfoRow>

        {expiry && (
          <ConfirmInfoRow
            label="Expiration date"
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
          <ConfirmInfoRowCurrency value={amountPerSecond.toString(16)} />
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
  let permissionTitle: string;

  const { expiry } = decodedPermission;

  switch (decodedPermission.permission.type) {
    case 'native-token-periodic':
      permissionTitle = 'Native token periodic';
      permissionDetail = (
        <NativeTokenPeriodDetails
          permission={
            decodedPermission.permission as NativeTokenPeriodicPermission
          }
          expiry={expiry}
        />
      );
      break;
    case 'native-token-stream':
      permissionTitle = 'Native token stream';
      permissionDetail = (
        <NativeTokenStreamDetails
          permission={
            decodedPermission.permission as NativeTokenStreamPermission
          }
          expiry={expiry}
        />
      );
      break;
    case 'erc20-token-periodic':
      permissionTitle = 'ERC20 token periodic';
      permissionDetail = (
        <Erc20TokenPeriodDetails
          permission={
            decodedPermission.permission as Erc20TokenPeriodicPermission
          }
          expiry={expiry}
        />
      );
      break;
    case 'erc20-token-stream':
      permissionTitle = 'ERC20 token stream';
      permissionDetail = (
        <Erc20TokenStreamDetails
          permission={
            decodedPermission.permission as Erc20TokenStreamPermission
          }
          expiry={expiry}
        />
      );
      break;
    default:
      throw new Error('Invalid permission type');
  }

  const requestFromTooltipMessage = isSnapId(decodedPermission.origin)
    ? t('requestFromInfoSnap')
    : t('requestFromInfo');

  return (
    <>
      <ConfirmInfoSection data-testid="confirmation_permission-section">
        <ConfirmInfoRow
          label={permissionTitle}
          tooltip="The type of permission being requested"
        />
        <ConfirmInfoRowDivider />
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={id}
          label={t('requestFrom')}
          tooltip={requestFromTooltipMessage}
        >
          <ConfirmInfoRowUrl url={decodedPermission.origin} />
        </ConfirmInfoAlertRow>
        <ConfirmInfoRow
          label="Justification"
          tooltip="The justification provided by the website for requesting this permission"
        >
          {decodedPermission.permission.justification}
        </ConfirmInfoRow>
        <NetworkRow />
        <SigningInWithRow />
      </ConfirmInfoSection>
      {permissionDetail}
    </>
  );
};

export default TypedSignPermissionInfo;
