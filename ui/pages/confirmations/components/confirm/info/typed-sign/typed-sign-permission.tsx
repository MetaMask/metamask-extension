import React from 'react';
import { SignatureRequestType } from '../../../../types/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
} from '@metamask/gator-permissions-controller';
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
import { isSnapId } from '@metamask/snaps-utils';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';
import { ConfirmInfoRowCurrency } from '../../../../../../components/app/confirm/info/row/currency';
import { hexToBigInt } from '@metamask/utils';
import { DAY } from '../../../../../../../shared/constants/time';
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

  const expiry = decodedPermission.expiry;

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

  const toolTipMessage = isSnapId((decodedPermission as any).origin)
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
          tooltip={toolTipMessage}
        >
          <ConfirmInfoRowUrl url={(decodedPermission as any).origin} />
        </ConfirmInfoAlertRow>
        <ConfirmInfoRow
          label="Justification"
          tooltip="The justification provided by the website for requesting this permission"
        >
          {(decodedPermission.permission as any).justification}
        </ConfirmInfoRow>
        <NetworkRow />
        <SigningInWithRow />
      </ConfirmInfoSection>
      {permissionDetail}
    </>
  );
};

export default TypedSignPermissionInfo;

const NativeTokenPeriodDetails: React.FC<{
  permission: NativeTokenPeriodicPermission;
  expiry: number | null;
}> = ({ permission, expiry }) => {
  const periodAmount = hexToBigInt(permission.data.periodAmount);
  const periodDuration = permission.data.periodDuration;
  const startTime = permission.data.startTime;

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
          tooltip="The duration of each period in seconds"
        >
          {periodDuration} seconds
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

  const startTime = permission.data.startTime;

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

const Erc20TokenPeriodDetails: React.FC<{
  permission: Erc20TokenPeriodicPermission;
  expiry: number | null;
}> = ({ permission, expiry }) => {
  const periodAmount = hexToBigInt(permission.data.periodAmount);
  const periodDuration = permission.data.periodDuration;
  const startTime = permission.data.startTime;
  const tokenAddress = permission.data.tokenAddress;

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
          tooltip="The duration of each period in seconds"
        >
          {periodDuration} seconds
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
  const tokenAddress = permission.data.tokenAddress;

  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }

  const startTime = permission.data.startTime;

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
