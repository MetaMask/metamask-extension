import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import {
  AvatarAccountSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import React from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import { toChecksumHexAddress } from '../../../../../../shared/lib/hexstring-utils';
import { FlexDirection } from '../../../../../helpers/constants/design-system';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoAlertRow } from '../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { ConfirmInfoRowAddressDisplay } from '../../../../../components/app/confirm/info/row/address-display';
import { PreferredAvatar } from '../../../../../components/app/preferred-avatar';
import { GasFeesSection } from '../../confirm/info/shared/gas-fees-section/gas-fees-section';
import { AdvancedDetails } from '../../confirm/info/shared/advanced-details/advanced-details';
import { NetworkRow } from '../../confirm/info/shared/network-row/network-row';
import { useConfirmContext } from '../../../context/confirm';
import MusdClaimHeading from './musd-claim-heading';

const MusdClaimAccountRow = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { chainId } = transactionMeta;
  const fromAddress = transactionMeta.txParams.from;

  const {
    name,
    isAccount,
    image,
    displayState,
    subtitle: walletName,
  } = useDisplayName({
    value: toChecksumHexAddress(fromAddress),
    type: NameType.ETHEREUM_ADDRESS,
    preferContractSymbol: true,
    variation: chainId,
  });

  const label = walletName
    ? t('musdClaimSendingToWallet', [walletName])
    : t('musdClaimSendingTo');

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      gap={2}
    >
      <Box style={{ flex: 1, minWidth: 0 }}>
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.SigningInWith}
          label={label}
          ownerId={transactionMeta.id}
          style={{ flexDirection: FlexDirection.Column, width: '100%' }}
        >
          <Box data-testid="musd-claim-account-address" className="w-full">
            <ConfirmInfoRowAddressDisplay
              address={fromAddress}
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
        address={toChecksumHexAddress(fromAddress)}
        size={AvatarAccountSize.Md}
        style={{ flexShrink: 0 }}
      />
    </Box>
  );
};

/**
 * Info component for mUSD claim (Merkl rewards) confirmation screen.
 *
 * Layout:
 * 1. Heading - "Claim bonus" label, mUSD amount + fiat, token icon on right
 * 2. Account section - "Sending to <Wallet>" with account name + avatar
 * 3. Network row
 * 4. Gas fees section (with Speed row)
 * 5. Advanced details (nonce, tx data - shown when toggled)
 */
export const MusdClaimInfo = () => {
  return (
    <>
      <MusdClaimHeading />
      <ConfirmInfoSection data-testid="musd-claim-details-section">
        <MusdClaimAccountRow />
      </ConfirmInfoSection>
      <ConfirmInfoSection data-testid="musd-claim-network-section">
        <NetworkRow />
      </ConfirmInfoSection>
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};
