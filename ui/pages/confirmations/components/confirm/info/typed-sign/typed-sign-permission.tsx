import {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
} from '@metamask/gator-permissions-controller';
import React from 'react';
import { isSnapId } from '@metamask/snaps-utils';

import { SignatureRequestType } from '../../../../types/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowUrl } from '../../../../../../components/app/confirm/info/row/url';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { NetworkRow } from '../shared/network-row/network-row';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';

import { NativeTokenStreamDetails } from './typed-sign-permission/native-token-stream-details';
import { Erc20TokenPeriodicDetails } from './typed-sign-permission/erc20-token-periodic-details';
import { Erc20TokenStreamDetails } from './typed-sign-permission/erc20-token-stream-details';
import {
  useErc20TokenDetails,
  useNativeTokenLabel,
} from './typed-sign-permission/typed-sign-permission-util';
import { NativeTokenPeriodicDetails } from './typed-sign-permission/native-token-periodic-details';

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

  const { expiry } = decodedPermission;

  switch (decodedPermission.permission.type) {
    case 'native-token-periodic': {
      const permission =
        decodedPermission.permission as NativeTokenPeriodicPermission;

      tokenLabel = useNativeTokenLabel(decodedPermission.chainId);

      permissionDetail = (
        <NativeTokenPeriodicDetails permission={permission} expiry={expiry} />
      );

      break;
    }
    case 'native-token-stream': {
      const permission =
        decodedPermission.permission as NativeTokenStreamPermission;

      tokenLabel = useNativeTokenLabel(decodedPermission.chainId);

      permissionDetail = (
        <NativeTokenStreamDetails permission={permission} expiry={expiry} />
      );

      break;
    }
    case 'erc20-token-periodic': {
      const permission =
        decodedPermission.permission as Erc20TokenPeriodicPermission;

      const { label, decimals } = useErc20TokenDetails({
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
      const permission =
        decodedPermission.permission as Erc20TokenStreamPermission;

      const { label, decimals } = useErc20TokenDetails({
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
