import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { FlexDirection } from '../../../../../helpers/constants/design-system';
import { ConfirmInfoAlertRow } from '../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoRowAddressDisplay } from '../../../../../components/app/confirm/info/row/address-display';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import { useConfirmContext } from '../../../context/confirm';

type Props = {
  address: string;
  label: string;
  alertKey: RowAlertKey;
  name: string | null;
  isAccount: boolean;
  image?: string;
  displayState: TrustSignalDisplayState;
  'data-testid'?: string;
};

export const AccountFlowRow = ({
  address,
  label,
  alertKey,
  name,
  isAccount,
  image,
  displayState,
  'data-testid': testId,
}: Props) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId, id: ownerId } = transactionMeta;

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
    >
      <Box style={{ flex: 1, minWidth: 0 }}>
        <ConfirmInfoAlertRow
          alertKey={alertKey}
          label={label}
          ownerId={ownerId}
          style={{ flexDirection: FlexDirection.Column, width: '100%' }}
        >
          <Box data-testid={testId} className="w-full">
            <ConfirmInfoRowAddressDisplay
              address={address}
              chainId={chainId}
              name={name}
              isAccount={isAccount}
              image={image}
              displayState={displayState}
              showAvatar={false}
            />
          </Box>
        </ConfirmInfoAlertRow>
      </Box>
      <PreferredAvatar
        address={toChecksumHexAddress(address)}
        size={AvatarAccountSize.Md}
        style={{ flexShrink: 0 }}
      />
    </Box>
  );
};
