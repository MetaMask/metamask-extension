import React from 'react';
import { isSnapId } from '@metamask/snaps-utils';

import { Text, TextVariant } from '@metamask/design-system-react';
import { SignatureRequestType } from '../../../../../types/confirm';
import { useConfirmContext } from '../../../../../context/confirm';
import { ConfirmInfoRow } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoRowAddress } from '../../../../../../../components/app/confirm/info/row/address';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoRowUrl } from '../../../../../../../components/app/confirm/info/row/url';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { NetworkRow } from '../../shared/network-row/network-row';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { SigningInWithRow } from '../../shared/sign-in-with-row/sign-in-with-row';

import { PermissionDetailRenderer } from './permission-detail-renderer';

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

  const { expiry, chainId } = decodedPermission;

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

        {decodedPermission.to && (
          <ConfirmInfoRow label={t('recipient')}>
            <ConfirmInfoRowAddress
              address={decodedPermission.to}
              chainId={chainId}
            />
          </ConfirmInfoRow>
        )}

        <NetworkRow />
      </ConfirmInfoSection>

      <PermissionDetailRenderer
        permission={decodedPermission.permission}
        expiry={expiry}
        chainId={chainId}
      />
    </>
  );
};

export default TypedSignPermissionInfo;
