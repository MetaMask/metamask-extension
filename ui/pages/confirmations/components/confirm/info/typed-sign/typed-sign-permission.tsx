import {
  Erc20TokenPeriodicPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
} from '@metamask/gator-permissions-controller';
import React from 'react';
import { isSnapId } from '@metamask/snaps-utils';

import { Text, TextVariant } from '@metamask/design-system-react';
import { SignatureRequestType } from '../../../../types/confirm';
import { useConfirmContext } from '../../../../context/confirm';
import { ConfirmInfoRow } from '../../../../../../components/app/confirm/info/row';
import { ConfirmInfoRowAddress } from '../../../../../../components/app/confirm/info/row/address';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowUrl } from '../../../../../../components/app/confirm/info/row/url';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { NetworkRow } from '../shared/network-row/network-row';
import { ConfirmInfoAlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';
import { SigningInWithRow } from '../shared/sign-in-with-row/sign-in-with-row';

import { NativeTokenStreamDetails } from './typed-sign-permission/native-token-stream-details';
import { NativeTokenPeriodicDetails } from './typed-sign-permission/native-token-periodic-details';
import { Erc20TokenPeriodicDetails } from './typed-sign-permission/erc20-token-periodic-details';
import { Erc20TokenStreamDetails } from './typed-sign-permission/erc20-token-stream-details';
import { Erc20TokenRevocationDetails } from './typed-sign-permission/erc20-token-revocation-details';

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

  const { expiry, chainId } = decodedPermission;

  switch (decodedPermission.permission.type) {
    case 'native-token-periodic': {
      const permission =
        decodedPermission.permission as NativeTokenPeriodicPermission;

      permissionDetail = (
        <NativeTokenPeriodicDetails
          permission={permission}
          expiry={expiry}
          chainId={chainId}
        />
      );

      break;
    }
    case 'native-token-stream': {
      const permission =
        decodedPermission.permission as NativeTokenStreamPermission;

      permissionDetail = (
        <NativeTokenStreamDetails
          permission={permission}
          expiry={expiry}
          chainId={chainId}
        />
      );

      break;
    }
    case 'erc20-token-periodic': {
      const permission =
        decodedPermission.permission as Erc20TokenPeriodicPermission;

      permissionDetail = (
        <Erc20TokenPeriodicDetails
          permission={permission}
          expiry={expiry}
          chainId={chainId}
        />
      );

      break;
    }
    case 'erc20-token-stream': {
      const permission =
        decodedPermission.permission as Erc20TokenStreamPermission;

      permissionDetail = (
        <Erc20TokenStreamDetails
          permission={permission}
          expiry={expiry}
          chainId={chainId}
        />
      );

      break;
    }
    case 'erc20-token-revocation': {
      permissionDetail = <Erc20TokenRevocationDetails expiry={expiry} />;
      break;
    }
    default:
      throw new Error('Invalid permission type');
  }

  const requestFromTooltipMessage = isSnapId(decodedPermission.origin)
    ? t('requestFromInfoSnap')
    : t('requestFromInfo');

  return (
    <>
      <ConfirmInfoSection data-testid="confirmation_justification-section">
        <ConfirmInfoRow
          label="Justification"
          tooltip={t('confirmFieldTooltipJustification')}
        >
          <Text variant={TextVariant.BodyMd}>
            {decodedPermission.permission.justification}
          </Text>
        </ConfirmInfoRow>

        <SigningInWithRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection data-testid="confirmation_permission-section">
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.RequestFrom}
          ownerId={id}
          label={t('requestFrom')}
          tooltip={requestFromTooltipMessage}
        >
          <ConfirmInfoRowUrl url={decodedPermission.origin} />
        </ConfirmInfoAlertRow>

        {'address' in decodedPermission.signer.data && (
          <ConfirmInfoRow label={t('recipient')}>
            <ConfirmInfoRowAddress
              address={decodedPermission.signer.data.address}
              chainId={chainId}
            />
          </ConfirmInfoRow>
        )}

        <NetworkRow />
      </ConfirmInfoSection>

      {permissionDetail}
    </>
  );
};

export default TypedSignPermissionInfo;
